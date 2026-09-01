const { User, Wallet, SavedContact, VerificationCode } = require('../models');
const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// ==========================================
// ENGINES BEBAS EMISI: NATIVE BASE32 DECODER & TOTP VERIFIER
// ==========================================
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const base32Decode = (str) => {
  let bin = '';
  for (let char of str.toUpperCase()) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new AppError('Deteksi karakter ilegal non-Base32 pada token 2FA.', StatusCodes.BAD_REQUEST);
    bin += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i < bin.length; i += 8) {
    const sub = bin.substring(i, i + 8);
    if (sub.length === 8) bytes.push(parseInt(sub, 2));
  }
  return Buffer.from(bytes);
};

const verifyTOTP = (token, secret) => {
  if (!secret || !token) return false;
  try {
    const counter = Math.floor(Date.now() / 30000);
    const secretBuffer = base32Decode(secret);
    const windowSteps = parseInt(process.env.TOTP_WINDOW_STEPS, 10) || 1;

    for (let i = -windowSteps; i <= windowSteps; i++) {
      const timeBuffer = Buffer.alloc(8);
      timeBuffer.writeUInt32BE(counter + i, 4);

      const hmac = crypto.createHmac('sha1', secretBuffer).update(timeBuffer).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');

      if (code === token) {
        return true;
      }
    }
  } catch (err) {
    return false;
  }
  return false;
};

// ========================================================
// 1. SERVICE LAYER: PROFILE & WALLET AGGREGATOR
// ========================================================
exports.getUserProfile = async (userId) => {
  console.log(`👤 [USER SERVICE] Menarik dashboard data untuk User ID: ${userId}`);
  
  const user = await User.findById(userId);
  if (!user) throw new AppError('Pengguna tidak ditemukan.', StatusCodes.NOT_FOUND);

  const wallet = await Wallet.findOne({ user_id: userId });

  return {
    profile: user,
    wallet: {
      balance: wallet ? wallet.balance : 0,
      currency: 'IDR'
    }
  };
};

// ========================================================
// 2. SERVICE LAYER: SETUP PIN PERDANA (FIRST TIME ONLY)
// ========================================================
exports.setupPin = async (userId, pin) => {
  if (!pin || pin.length !== 6 || isNaN(pin)) {
    throw new AppError('PIN transaksi wajib berupa 6 digit angka murni.', StatusCodes.BAD_REQUEST);
  }

  const user = await User.findById(userId).select('+pin');
  if (!user) throw new AppError('Pengguna tidak ditemukan.', StatusCodes.NOT_FOUND);
  if (user.pin) throw new AppError('PIN sudah dikonfigurasi sebelumnya.', StatusCodes.BAD_REQUEST);

  user.pin = pin;
  await user.save();

  return { message: 'PIN transaksi berhasil diaktifkan.' };
};

// ========================================================
// 3. SERVICE LAYER: UBAH PASSWORD (DI DALAM LOGGED-IN STATE)
// ========================================================
exports.updatePassword = async (userId, passwordData) => {
  const { old_password, new_password, confirm_new_password } = passwordData;

  if (!old_password || !new_password || !confirm_new_password) {
    throw new AppError('Seluruh kolom password wajib diisi.', StatusCodes.BAD_REQUEST);
  }

  if (new_password !== confirm_new_password) {
    throw new AppError('Konfirmasi password baru tidak cocok.', StatusCodes.BAD_REQUEST);
  }

  const user = await User.findById(userId).select('+password');
  const isPasswordCorrect = await user.correctPassword(old_password, user.password);
  if (!isPasswordCorrect) {
    throw new AppError('Password lama yang Anda masukkan salah.', StatusCodes.BAD_REQUEST);
  }

  user.password = new_password;
  await user.save();

  return { message: 'Password akun Anda berhasil diperbarui.' };
};

// ========================================================
// 4. SERVICE LAYER: DYNAMIC CHANGE EMAIL (DIAGRAM ALUR SINKRON)
// ========================================================
// Spesifikasi Gambar: Input Email Baru -> Verifikasi OTP -> Verifikasi PIN -> Eksekusi
exports.updateEmailSecurely = async (userId, emailData) => {
  const { new_email, otp, pin } = emailData;

  console.log(`📧 [USER SERVICE] Memproses perubahan email aman untuk User ID: ${userId}`);

  // Benteng 1: Kelengkapan Data Input
  if (!new_email || !otp || !pin) {
    throw new AppError('Email baru, token OTP, dan PIN transaksi wajib disertakan.', StatusCodes.BAD_REQUEST);
  }

  // Benteng 2: Validasi Duplikasi Global
  const isEmailTaken = await User.findOne({ email: new_email, _id: { $ne: userId } });
  if (isEmailTaken) throw new AppError('Email tersebut sudah digunakan oleh akun lain.', StatusCodes.BAD_REQUEST);

  // Tarik user beserta field terisolasi (pin dan 2fa)
  const user = await User.findById(userId).select('+pin +two_factor_secret +two_factor_enabled');
  if (!user) throw new AppError('Pengguna tidak ditemukan.', StatusCodes.NOT_FOUND);

  // Benteng 3: Verifikasi PIN (Sesuai Diagram)
  if (!user.pin) throw new AppError('Aktivasi PIN Anda terlebih dahulu sebelum mengubah data sensitif.', StatusCodes.BAD_REQUEST);
  const isPinValid = await user.correctPin(pin, user.pin);
  if (!isPinValid) throw new AppError('PIN transaksi yang Anda masukkan salah.', StatusCodes.BAD_REQUEST);

  // Benteng 4: Verifikasi OTP / 2FA (Sesuai Diagram)
  if (user.two_factor_enabled) {
    const isValid = verifyTOTP(otp, user.two_factor_secret);
    if (!isValid) {
      throw new AppError('Token otentikasi 2FA tidak valid atau telah kedaluwarsa.', StatusCodes.UNAUTHORIZED);
    }
  } else {
    const otpRecord = await VerificationCode.findOne({
      user_id: userId,
      code: otp,
      type: 'change_email',
      is_used: false,
      expires_at: { $gt: Date.now() }
    });

    if (!otpRecord) {
      throw new AppError('Kode OTP pembaruan email tidak valid atau telah kedaluwarsa.', StatusCodes.BAD_REQUEST);
    }

    otpRecord.is_used = true;
    await otpRecord.save();
  }

  // Eksekusi Pembaruan Data
  user.email = new_email;
  await user.save();

  return { message: 'Email Anda sukses diperbarui sesuai verifikasi otentikasi.', email: user.email };
};

// ========================================================
// 5. SERVICE LAYER: DYNAMIC CHANGE PIN (DIAGRAM ALUR SINKRON)
// ========================================================
// Spesifikasi Gambar: Input PIN Lama -> Verifikasi OTP -> Masukkan PIN Baru & Konfirmasi
exports.updatePinSecurely = async (userId, pinData) => {
  const { old_pin, otp, new_pin, confirm_new_pin } = pinData;

  console.log(`🔐 [USER SERVICE] Memproses pergantian PIN bersyarat untuk User ID: ${userId}`);

  if (!old_pin || !otp || !new_pin || !confirm_new_pin) {
    throw new AppError('Seluruh parameter otentikasi PIN dan OTP wajib diisi.', StatusCodes.BAD_REQUEST);
  }

  if (new_pin !== confirm_new_pin) throw new AppError('Konfirmasi PIN baru tidak cocok.', StatusCodes.BAD_REQUEST);
  if (new_pin.length !== 6 || isNaN(new_pin)) throw new AppError('PIN baru wajib berupa 6 digit angka.', StatusCodes.BAD_REQUEST);

  const user = await User.findById(userId).select('+pin +two_factor_secret +two_factor_enabled');
  if (!user) throw new AppError('Pengguna tidak ditemukan.', StatusCodes.NOT_FOUND);

  // Benteng 1: Cek Keaslian PIN Lama (Sesuai Diagram)
  if (!user.pin) throw new AppError('Aktivasi PIN Anda terlebih dahulu sebelum mengubah data sensitif.', StatusCodes.BAD_REQUEST);
  const isOldPinValid = await user.correctPin(old_pin, user.pin);
  if (!isOldPinValid) throw new AppError('PIN lama yang Anda masukkan salah.', StatusCodes.BAD_REQUEST);

  // Benteng 2: Cek OTP / 2FA (Sesuai Diagram)
  if (user.two_factor_enabled) {
    const isValid = verifyTOTP(otp, user.two_factor_secret);
    if (!isValid) {
      throw new AppError('Token otentikasi 2FA tidak valid atau telah kedaluwarsa.', StatusCodes.UNAUTHORIZED);
    }
  } else {
    const otpRecord = await VerificationCode.findOne({
      user_id: userId,
      code: otp,
      type: 'change_pin',
      is_used: false,
      expires_at: { $gt: Date.now() }
    });

    if (!otpRecord) {
      throw new AppError('Kode OTP pembaruan PIN tidak valid atau telah kedaluwarsa.', StatusCodes.BAD_REQUEST);
    }

    otpRecord.is_used = true;
    await otpRecord.save();
  }

  // Eksekusi Pemuatan Data Baru
  user.pin = new_pin;
  await user.save();

  return { message: 'PIN transaksi Anda berhasil dimutasi dan dikunci kembali.' };
};

// ========================================================
// 6. SERVICE LAYER: SIMULASI KYC VERIFIED PREMIUM
// ========================================================
exports.updateKYC = async (userId, nik) => {
  if (!nik || nik.length !== 16 || isNaN(nik)) {
    throw new AppError('NIK wajib diisi dengan 16 digit angka valid.', StatusCodes.BAD_REQUEST);
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError('Pengguna tidak terdaftar.', StatusCodes.NOT_FOUND);
  if (user.is_verified) throw new AppError('Akun Anda sudah berstatus terverifikasi premium.', StatusCodes.BAD_REQUEST);

  user.nik = nik;
  user.is_verified = true;
  await user.save();

  return user;
};

// ========================================================
// 7. SERVICE LAYER: AMBIL DAFTAR KONTAK TERTRANSAKSI (RECENT CONTACTS)
// ========================================================
exports.getSavedContacts = async (userId) => {
  console.log(`🎴 [USER SERVICE] Menarik daftar kontak tersimpan untuk User ID: ${userId}`);

  // Tarik relasi SavedContact berdasarkan user_id pengirim
  const savedContacts = await SavedContact.find({ user_id: userId })
    .populate('contact_user_id', 'username email phone_number avatar is_verified')
    .sort({ updatedAt: -1 }); // Urutkan dari penerima transfer paling baru

  // Lakukan pembersihan dan pemetaan data agar siap dikonsumsi UI React Native
  return savedContacts
    .filter(item => item.contact_user_id !== null)
    .map(item => item.contact_user_id);
};