
// const {User, Wallet, Verificationcode} = require('../models');
// const AppError = require('../utils/AppError');
// const sendEmail = require('../utils/email');
// const { StatusCodes } = require('http-status-codes');
// const { signToken } = require('../utils/jwt');
// const mongoose = require('mongoose');
// const crypto = require('crypto')

// exports.registerUser = async (userData) => {
//   console.log('🔍 [FORENSIK INTERN] Memulai proses registrasi untuk email:', userData.email);
  
//   const useTransaction = process.env.USE_TRANSACTIONS === 'true';
//   let session = null;
  
//   // Penampung ID untuk manual rollback jika database standalone
//   let createdUserId = null;
//   let createdWalletId = null;

//   if (useTransaction) {
//     session = await mongoose.startSession();
//     session.startTransaction();
//   }

//   try {
//     const options = session ? { session } : {};

//     // 1. Buat pengguna baru
//     console.log('⚡ [LANGKAH 1] Mencoba mengunci data entitas User...');
//     const [newUser] = await User.create([userData], options);
//     createdUserId = newUser._id; // Amankan ID untuk tracking
//     console.log(`✅ [LANGKAH 1] User berhasil dibuat dengan ID: ${createdUserId}`);

//     // 2. Buat dompet otomatis
//     console.log('⚡ [LANGKAH 2] Menyinkronkan pembuatan Wallet baru...');
//     const [newWallet] = await Wallet.create([{
//       user_id: createdUserId,
//       balance: 0
//     }], options);
//     createdWalletId = newWallet._id;
//     console.log('✅ [LANGKAH 2] Wallet Rp 0 terikat aman pada User.');

//     // 3. Produksi 6-Digit OTP Kriptografi
//     console.log('⚡ [LANGKAH 3] Menghasilkan 6-Digit OTP via Kriptografi CSPRNG...');
//     const otpCode = crypto.randomInt(100000, 999999).toString();
//     const otpExpiration = new Date(Date.now() + 10 * 60 * 1000);
//     console.log('✅ [LANGKAH 3] OTP Terproduksi secara acak aman.');

//     // 4. Catat kode OTP ke database
//     console.log('⚡ [LANGKAH 4] Mencoba mencatat bukti OTP ke Database...');
//     await Verificationcode.create([{
//       user_id: createdUserId,
//       code: otpCode,
//       type: 'email_verification',
//       expires_at: otpExpiration
//     }], options);
//     console.log('✅ [LANGKAH 4] Kode OTP berhasil diamankan di database.');

//     // 5. Terbangkan Paket Notifikasi via Nodemailer + Mailtrap
//     console.log('⚡ [LANGKAH 5] Mempersiapkan payload dan menembak Mailtrap...');
//     const emailOptions = {
//       email: newUser.email,
//       subject: 'GreenPay - Kode Verifikasi Registrasi Akun Anda',
//       message: `Selamat datang di GreenPay, ${newUser.username}!\n\nKode OTP Anda adalah: ${otpCode}`
//     };
//     await sendEmail(emailOptions);
//     console.log('✅ [LANGKAH 5] Paket SMTP diterima oleh server kurir Mailtrap.');

//     // Commit jika menggunakan transaksi
//     if (session) {
//       await session.commitTransaction();
//       session.endSession();
//     }

//     const userResponse = newUser.toObject();
//     delete userResponse.password;
//     const token = signToken(userResponse._id, userResponse.role);

//     return { user: userResponse, token };

//   } catch (error) {
//     console.error('💥 [ALARM CRASH] Terjadi kegagalan fatal pada alur RegisterUser!');
    
//     // Opsi A: Jika Transaksi Aktif -> Serahkan ke MongoDB Engine
//     if (session) {
//       await session.abortTransaction();
//       session.endSession();
//       console.warn('🚨 [ROLLBACK] Transaksi dibatalkan otomatis oleh MongoDB.');
//     } 
//     // Opsi B: Jika Standalone Aktif -> Jalankan PEMBERSIHAN MANUAL (Dinamis & Adaptif)
//     else {
//       console.warn('🚨 [MANUAL CLEANUP] Menghapus sisa hantu data akibat crash di database Standalone...');
//       if (createdWalletId) await Wallet.findByIdAndDelete(createdWalletId);
//       if (createdUserId) await User.findByIdAndDelete(createdUserId);
//       console.log('🧹 [MANUAL CLEANUP] Database kembali bersih. Bebas dari duplikasi di percobaan berikutnya.');
//     }

//     throw error;
//   }
// };

// exports.loginUser = async (email, password) => {
//   if (!email || !password) {
//     throw new AppError('Silakan masukkan email dan password', StatusCodes.BAD_REQUEST);
//   }

//   // PERBAIKAN FORENSIK: Wajib panggil .select('+password') secara paksa
//   const user = await User.findOne({ email }).select('+password');
  
//   if (!user) {
//     throw new AppError('Email atau password salah', StatusCodes.UNAUTHORIZED);
//   }

//   // Pengecekan Lockout (Anti-Brute Force)
//   if (user.lock_until && user.lock_until > Date.now()) {
//     const remainingTime = Math.ceil((user.lock_until - Date.now()) / 1000);
//     throw new AppError(
//       `Akun diblokir sementara. Coba lagi dalam ${remainingTime} detik.`,
//       StatusCodes.FORBIDDEN
//     );
//   }

//   const isPasswordCorrect = await user.correctPassword(password, user.password);

//   if (!isPasswordCorrect) {
//     user.login_attempts += 1;
//     if (user.login_attempts >= 3) {
//       user.lock_until = Date.now() + 60 * 1000; // Kunci 60 detik
//       user.login_attempts = 0;
//       await user.save({ validateBeforeSave: false });
//       throw new AppError(
//         'Salah password 3 kali. Akun dikunci selama 60 detik.',
//         StatusCodes.FORBIDDEN
//       );
//     }
//     await user.save({ validateBeforeSave: false });
//     throw new AppError('Email atau password salah', StatusCodes.UNAUTHORIZED);
//   }

//   // Jika sukses, reset seluruh jejak percobaan login
//   user.login_attempts = 0;
//   user.lock_until = undefined;
//   await user.save({ validateBeforeSave: false });

//   // Bersihkan password dari memori sebelum dilempar ke controller/klien
//   user.password = undefined;

//   const token = signToken(user._id, user.role);
//   return { user, token };
// };

// exports.verifyEmail = async (email, code) => {
//   // 1. Validasi Keberadaan Input
//   if (!email || !code) {
//     throw new AppError('Email dan kode OTP wajib diisi secara lengkap', StatusCodes.BAD_REQUEST);
//   }

//   // 2. Cari Pengguna Berdasarkan Email
//   const user = await User.findOne({ email });
//   if (!user) {
//     throw new AppError('Pengguna dengan email tersebut tidak ditemukan', StatusCodes.NOT_FOUND);
//   }

//   // 3. Cek Idempotensi: Cegah verifikasi ganda yang tidak diperlukan
//   if (user.is_verified) {
//     throw new AppError('Akun ini sudah berstatus terverifikasi sebelumnya', StatusCodes.BAD_REQUEST);
//   }

//   // 4. Mulai Transaksi Atomik Lapis Baja
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // 5. Pembuktian Forensik Kode OTP di Database
//     const otpRecord = await Verificationcode.findOne({
//       user_id: user._id,
//       code: code,
//       type: 'email_verification',
//       is_used: false,
//       expires_at: { $gt: Date.now() } // Memastikan OTP belum kedaluwarsa
//     }).session(session);

//     // Jika tidak ditemukan, berarti kode salah, sudah dipakai, atau kedaluwarsa (terhapus oleh TTL Index)
//     if (!otpRecord) {
//       throw new AppError('Kode OTP tidak valid atau telah kedaluwarsa', StatusCodes.BAD_REQUEST);
//     }

//     // 6. Kunci OTP agar tidak bisa digunakan kembali (Anti-Replay Attack)
//     otpRecord.is_used = true;
//     await otpRecord.save({ session });

//     // 7. Ubah Status Pengguna Menjadi Aktif Terverifikasi
//     user.is_verified = true;
//     // validateBeforeSave diatur false karena field password tidak ikut ditarik (select: false)
//     await user.save({ session, validateBeforeSave: false });

//     // Komit seluruh operasi jika tidak ada interupsi jaringan
//     await session.commitTransaction();
//     session.endSession();

//     return true;
//   } catch (error) {
//     // Batalkan mutasi data jika di tengah jalan terjadi kegagalan sistem
//     await session.abortTransaction();
//     session.endSession();
//     throw error;
//   }
// };

const { User, Wallet, VerificationCode, RefreshToken } = require('../models');
const AppError = require('../utils/AppError');
const sendEmail = require('../utils/email');
const { StatusCodes } = require('http-status-codes');
const { signAccessToken, signRefreshToken, signPreAuthToken, verifyPreAuthToken } = require('../utils/jwt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const crypto = require('crypto');

// GLOBAL ENVIRONMENT CONFIG CHECK
const useTransaction = () => process.env.USE_TRANSACTIONS === 'true';

// ==========================================
// ENGINES BEBAS EMISI: NATIVE BASE32 ENCODER & DECODER
// ==========================================
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const base32Encode = (buffer) => {
  let bin = '';
  for (let byte of buffer) {
    bin += byte.toString(2).padStart(8, '0');
  }
  let secret = '';
  for (let i = 0; i < bin.length; i += 5) {
    const sub = bin.substring(i, i + 5);
    const idx = parseInt(sub, 2);
    secret += BASE32_ALPHABET[idx];
  }
  return secret;
};

const base32Decode = (str) => {
  let bin = '';
  for (let char of str.toUpperCase()) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) throw new AppError('Deteksi karakter ilegal non-Base32 pada token 2FA.', 400);
    bin += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i < bin.length; i += 8) {
    const sub = bin.substring(i, i + 8);
    if (sub.length === 8) bytes.push(parseInt(sub, 2));
  }
  return Buffer.from(bytes);
};

// ==========================================
// 1. LOGIKA BISNIS: REGISTRASI PENGGUNA
// ==========================================
exports.registerUser = async (userData) => {
  console.log('🔍 [FORENSIK INTERN] Memulai proses registrasi untuk email:', userData.email);
  
  const isAtomic = useTransaction();
  let session = null;
  
  let createdUserId = null;
  let createdWalletId = null;
  let createdRefreshTokenId = null;

  if (isAtomic) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    const options = session ? { session } : {};

    // Langkah 1: Buat pengguna baru
    console.log('⚡ [LANGKAH 1] Mencoba mengunci data entitas User...');
    const [newUser] = await User.create([userData], options);
    createdUserId = newUser._id;
    console.log(`✅ [LANGKAH 1] User berhasil dibuat dengan ID: ${createdUserId}`);

    // Langkah 2: Buat dompet otomatis
    console.log('⚡ [LANGKAH 2] Menyinkronkan pembuatan Wallet baru...');
    const [newWallet] = await Wallet.create([{
      user_id: createdUserId,
      balance: 0
    }], options);
    createdWalletId = newWallet._id;
    console.log('✅ [LANGKAH 2] Wallet Rp 0 terikat aman pada User.');

    // Langkah 3: Produksi 6-Digit OTP Kriptografi
    console.log('⚡ [LANGKAH 3] Menghasilkan 6-Digit OTP via Kriptografi CSPRNG...');
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000);

    // Langkah 4: Catat kode OTP ke database
    console.log('⚡ [LANGKAH 4] Mencoba mencatat bukti OTP ke Database...');
    await VerificationCode.create([{
      user_id: createdUserId,
      code: otpCode,
      type: 'email_verification',
      expires_at: otpExpiration
    }], options);
    console.log('✅ [LANGKAH 4] Kode OTP berhasil diamankan di database.');

    // Langkah 5: Terbangkan Paket Notifikasi via Nodemailer + Mailtrap
    console.log('⚡ [LANGKAH 5] Mempersiapkan payload dan menembak Mailtrap...');
    const emailOptions = {
      email: newUser.email,
      subject: 'GreenPay - Kode Verifikasi Registrasi Akun Anda',
      message: `Selamat datang di GreenPay, ${newUser.username}!\n\nKode OTP Anda adalah: ${otpCode}`
    };
    await sendEmail(emailOptions);
    console.log('✅ [LANGKAH 5] Paket SMTP diterima oleh server kurir Mailtrap.');

    // 🚀 LANGKAH 6: PRODUKSI DUAL-TOKEN ENTERPRISE & KUNCI REFRESH TOKEN
    console.log('⚡ [LANGKAH 6] Memproduksi Dual-Token Enterprise & mengunci Refresh Token...');
    const accessToken = signAccessToken(newUser._id, newUser.role);
    const refreshToken = signRefreshToken(newUser._id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [createdRefreshToken] = await RefreshToken.create([{
      user_id: newUser._id,
      token: refreshToken,
      expires_at: expiresAt
    }], options);
    createdRefreshTokenId = createdRefreshToken._id;

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    const userResponse = newUser.toObject();
    delete userResponse.password;

    return { 
      user: userResponse, 
      accessToken, 
      refreshToken 
    };

  } catch (error) {
    console.error('💥 [ALARM CRASH] Terjadi kegagalan fatal pada alur RegisterUser!');
    if (session) {
      await session.abortTransaction();
      session.endSession();
    } else {
      console.warn('🚨 [MANUAL CLEANUP] Menghapus sisa hantu data di database Standalone...');
      if (createdRefreshTokenId) await RefreshToken.findByIdAndDelete(createdRefreshTokenId);
      if (createdWalletId) await Wallet.findByIdAndDelete(createdWalletId);
      if (createdUserId) await User.findByIdAndDelete(createdUserId);
      console.log('🧹 [MANUAL CLEANUP] Database kembali bersih.');
    }
    throw error;
  }
};

// ==========================================
// 2. LOGIKA BISNIS: AUTENTIKASI MASUK (LOGIN)
// ==========================================
// exports.loginUser = async (email, password) => {
//   if (!email || !password) {
//     throw new AppError('Silakan masukkan email dan password', StatusCodes.BAD_REQUEST);
//   }

//   const user = await User.findOne({ email }).select('+password');
  
//   if (!user) {
//     throw new AppError('Email atau password salah', StatusCodes.UNAUTHORIZED);
//   }

//   // [GUARD CLAUSE] Validasi Sesi Verifikasi Email (Aturan Fintech Enterprise)
//   if (!user.is_verified) {
//     throw new AppError('Akun Anda belum terverifikasi secara forensik. Silakan lakukan verifikasi OTP email terlebih dahulu.', StatusCodes.FORBIDDEN);
//   }

//   if (user.lock_until && user.lock_until > Date.now()) {
//     const remainingTime = Math.ceil((user.lock_until - Date.now()) / 1000);
//     throw new AppError(`Akun diblokir sementara. Coba lagi dalam ${remainingTime} detik.`, StatusCodes.FORBIDDEN);
//   }

//   const isPasswordCorrect = await user.correctPassword(password, user.password);

//   if (!isPasswordCorrect) {
//     user.login_attempts += 1;
//     if (user.login_attempts >= 3) {
//       user.lock_until = Date.now() + 60 * 1000;
//       user.login_attempts = 0;
//       await user.save({ validateBeforeSave: false });
//       throw new AppError('Salah password 3 kali. Akun dikunci selama 60 detik.', StatusCodes.FORBIDDEN);
//     }
//     await user.save({ validateBeforeSave: false });
//     throw new AppError('Email atau password salah', StatusCodes.UNAUTHORIZED);
//   }

//   user.login_attempts = 0;
//   user.lock_until = undefined;
//   await user.save({ validateBeforeSave: false });

//   user.password = undefined;
//   const token = signToken(user._id, user.role);
//   return { user, token };
// };

exports.loginUser = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Silakan masukkan email dan password', StatusCodes.BAD_REQUEST);
  }

  const user = await User.findOne({ email }).select('+password +two_factor_enabled');
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError('Email atau password salah', StatusCodes.UNAUTHORIZED);
  }

  if (!user.is_verified) {
    throw new AppError('Akun Anda belum terverifikasi OTP email.', StatusCodes.FORBIDDEN);
  }

  // [ZERO-TRUST 2FA CHECK] Jika pengguna mengaktifkan 2FA, tahan penerbitan token sesi
  if (user.two_factor_enabled) {
    const preAuthToken = signPreAuthToken(user._id);
    user.password = undefined;

    return {
      require_2fa: true,
      pre_auth_token: preAuthToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        is_verified: user.is_verified,
        two_factor_enabled: true
      }
    };
  }

  // PRODUKSI DUAL-TOKEN ENTERPRISE
  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  // Kunci Refresh Token ke dalam Database (Masa Aktif 7 Hari)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    user_id: user._id,
    token: refreshToken,
    expires_at: expiresAt
  });

  user.password = undefined;
  return { require_2fa: false, user, accessToken, refreshToken };
};

// ==========================================
// 3. LOGIKA BISNIS: VERIFIKASI EMAIL OTP
// ==========================================
exports.verifyEmail = async (email, code) => {
  console.log(`🔍 [FORENSIK INTERN] Memulai pencocokan OTP untuk email: ${email}`);
  
  if (!email || !code) {
    throw new AppError('Email dan kode OTP wajib diisi secara lengkap', StatusCodes.BAD_REQUEST);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Pengguna dengan email tersebut tidak ditemukan', StatusCodes.NOT_FOUND);
  }

  if (user.is_verified) {
    throw new AppError('Akun ini sudah berstatus terverifikasi sebelumnya', StatusCodes.BAD_REQUEST);
  }

  const isAtomic = useTransaction();
  let session = null;

  if (isAtomic) {
    session = await mongoose.startSession();
    session.startTransaction();
    console.log('💎 [VERIFY-TRANSAKSI] Sesi ACID Mongoose diaktifkan.');
  }

  try {
    const options = session ? { session } : {};

    // Eksekusi Query Adaptif memanfaatkan object options dinamis
    const otpRecord = await VerificationCode.findOne({
      user_id: user._id,
      code: code,
      type: 'email_verification',
      is_used: false,
      expires_at: { $gt: Date.now() }
    }).session(session); // Metode chaining session otomatis diabaikan Mongoose jika bernilai null

    if (!otpRecord) {
      throw new AppError('Kode OTP tidak valid atau telah kedaluwarsa', StatusCodes.BAD_REQUEST);
    }

    // Kunci Kredensial OTP agar tidak terjadi Replay Attack
    otpRecord.is_used = true;
    await otpRecord.save(options);
    console.log('🔒 [VERIFY] Kode OTP dikunci permanen (is_used = true).');

    // Mutasi Status Pengguna Menjadi Aktif Terverifikasi
    user.is_verified = true;
    await user.save({ session, validateBeforeSave: false });
    console.log(' Akun resmi dinyatakan Valid Forensik.');

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    return true;
  } catch (error) {
    console.error('💥 [VERIFY CRASH] Alur eksekusi verifikasi OTP terinterupsi!');
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }
};

// FITUR: PERMINTAAN RESET PASSWORD (FORGOT)
// ==========================================
exports.forgotPassword = async (email) => {
  if (!email) throw new AppError('Alamat email wajib dicantumkan.', StatusCodes.BAD_REQUEST);

  const user = await User.findOne({ email });
  if (!user) {
    // Kebijakan FinTech: Tetap kembalikan sukses meski email tidak ada demi mencegah Enumerasi Akun oleh hacker
    console.warn(`🕵️ [SECURITY WARNING] Percobaan Forgot Password untuk email tidak terdaftar: ${email}`);
    return true; 
  }

  // Produksi 6-Digit OTP Kriptografi khusus Reset Password
  const resetCode = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Kadaluwarsa ketat: 5 Menit

  // Simpan ke database memanfaatkan model VerificationCode yang sudah rapi
  await VerificationCode.create([{
    user_id: user._id,
    code: resetCode,
    type: 'forgot_password',
    expires_at: expiresAt
  }]);

  // Terbangkan Notifikasi Pemulihan Akses ke Mailtrap
  await sendEmail({
    email: user.email,
    subject: 'GreenPay - Permintaan Pemulihan Kata Sandi Akun Anda',
    message: `Anda menerima email ini karena ada permintaan reset password.\n\nKode OTP Reset Password Anda adalah: ${resetCode}\n\nKode ini hanya berlaku 5 menit.`
  });

  return true;
};


exports.resetPassword = async (email, otp, newPassword) => {
  console.log(`🔐 [AUTH SERVICE] Memproses eksekusi reset password untuk email: ${email}`);

  // Benteng 1: Kelengkapan Input
  if (!email || !otp || !newPassword) {
    throw new AppError('Email, kode OTP, dan password baru wajib diisi secara lengkap.', StatusCodes.BAD_REQUEST);
  }

  if (newPassword.length < 8) {
    throw new AppError('Password baru minimal harus terdiri dari 8 karakter.', StatusCodes.BAD_REQUEST);
  }

  // Cari entitas user pemilik email
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError('Pengguna dengan email tersebut tidak ditemukan.', StatusCodes.NOT_FOUND);
  }

  // Deteksi Topologi Dinamis (Anti-Crash Lokal Standalone)
  let useTx = process.env.USE_TRANSACTIONS === 'true';
  const topology = mongoose.connection.client?.topology?.description?.type;
  if (topology === 'Single' || topology === 'Unknown') useTx = false;

  let session = null;
  if (useTx) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    const options = session ? { session } : {};

    // Benteng 2: Validasi Forensik Tiket OTP Reset
    const otpRecord = await VerificationCode.findOne({
      user_id: user._id,
      code: otp,
      type: 'forgot_password',
      is_used: false,
      expires_at: { $gt: Date.now() }
    }).session(session);

    if (!otpRecord) {
      throw new AppError('Kode OTP reset password tidak valid atau telah kedaluwarsa.', StatusCodes.BAD_REQUEST);
    }

    // Hanguskan OTP agar tidak bisa disalahgunakan kembali (Anti-Replay Attack)
    otpRecord.is_used = true;
    await otpRecord.save(options);

    // Tindakan Mutasi: Masukkan password baru (Otomatis ter-hashing oleh pre-save hook User)
    user.password = newPassword;
    
    // Buka blokir percobaan login salah jika sebelumnya akun sempat terkunci
    user.login_attempts = 0;
    user.lock_until = undefined;
    
    await user.save({ session, validateBeforeSave: false });
    console.log(`✅ [RESET PASSWORD SUCCESS] Kata sandi baru untuk ${email} resmi dikunci di database.`);

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    return true;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }
};

// // ==========================================
// // FITUR: GENERATE 2FA SECRET (UNTUK AUTHENTICATOR APP)
// // ==========================================
// exports.generate2FASecret = async (userId) => {
//   const user = await User.findById(userId);
//   if (!user) throw new AppError('Pengguna tidak ditemukan.', StatusCodes.NOT_FOUND);

//   // Produksi Secret Key Base32 acak secara kriptografis (Standar Google Authenticator)
//   const secret = crypto.randomBytes(10).toString('hex').slice(0, 16).toUpperCase();

//   // Amankan secret ke database secara terisolasi (select: false melindungi field ini)
//   user.two_factor_secret = secret;
//   await user.save({ validateBeforeSave: false });

//   // Kembalikan secret. Nanti di Frontend, string ini bisa diubah jadi QR Code
//   return {
//     secret,
//     otpauth_url: `otpauth://totp/GreenPay:${user.email}?secret=${secret}&issuer=GreenPay`
//   };
// };

// // ==========================================
// // FITUR: VERIFIKASI TOKEN 2FA (TOTP ENGINE NATIVE)
// // ==========================================
// exports.verify2FAToken = async (userId, token) => {
//   const user = await User.findById(userId).select('+two_factor_secret');
//   if (!user || !user.two_factor_secret) {
//     throw new AppError('Aktivasi 2FA belum diinisialisasi pada akun ini.', StatusCodes.BAD_REQUEST);
//   }

//   // TOTP Algoritma Forensik: Hitung counter waktu (jendela 30 detik)
//   const counter = Math.floor(Date.now() / 30000);
//   const secretBuffer = Buffer.from(user.two_factor_secret, 'ascii');

//   // Lakukan validasi token untuk rentang waktu sekarang, 30 detik lalu, dan 30 detik ke depan (Toleransi Latensi Jaringan)
//   let isValid = false;
//   for (let i = -1; i <= 1; i++) {
//     const timeBuffer = Buffer.alloc(8);
//     timeBuffer.writeUInt32BE(counter + i, 4);

//     // Hitung hash HMAC-SHA1
//     const hmac = crypto.createHmac('sha1', secretBuffer).update(timeBuffer).digest();
//     const offset = hmac[hmac.length - 1] & 0xf;
//     const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');

//     if (code === token) {
//       isValid = true;
//       break;
//     }
//   }

//   if (!isValid) throw new AppError('Kode otentikasi 2FA tidak valid atau kadaluwarsa.', StatusCodes.UNAUTHORIZED);

//   // Jika proses verifikasi sukses pertama kali, kunci status 2FA akun menjadi aktif
//   if (!user.two_factor_enabled) {
//     user.two_factor_enabled = true;
//     await user.save({ validateBeforeSave: false });
//   }

//   return true;
// };

// ==========================================
// REVISI FITUR: GENERATE 2FA SECRET (BASE32 STANDARD)
// ==========================================
// exports.generate2FASecret = async (userId) => {
//   const user = await User.findById(userId);
//   if (!user) throw new AppError('Pengguna tidak ditemukan.', StatusCodes.NOT_FOUND);

//   // 1. Ambil 20 bytes acak aman (CSPRNG)
//   const randomBytes = crypto.randomBytes(20);
  
//   // 2. Transformasikan ke Base32 murni (Menghasilkan tepat 16 karakter valid)
//   const secret = base32Encode(randomBytes);

//   // 3. Kunci ke database
//   user.two_factor_secret = secret;
//   await user.save({ validateBeforeSave: false });

//   console.log(`🔐 [2FA GENERATE] Berhasil menerbitkan kunci Base32 sah untuk [${user.email}]: ${secret}`);

//   return {
//     secret,
//     otpauth_url: `otpauth://totp/GreenPay:${user.email}?secret=${secret}&issuer=GreenPay`
//   };
// };

exports.generate2FASecret = async (userId) => {
  const user = await User.findById(userId).select('+two_factor_secret');
  if (!user) throw new AppError('Pengguna tidak ditemukan.', StatusCodes.NOT_FOUND);

  // [GUARD CLAUSE ENTITASI] Mencegah overwrite rahasia jika 2FA sudah aktif terpakai
  if (user.two_factor_enabled && user.two_factor_secret) {
    throw new AppError(
      'Proteksi 2FA sudah aktif terkunci pada akun ini. Anda tidak diizinkan meregenerasi kunci baru demi keamanan.',
      StatusCodes.BAD_REQUEST
    );
  }

  const randomBytes = crypto.randomBytes(20);
  const secret = base32Encode(randomBytes);

  user.two_factor_secret = secret;
  await user.save({ validateBeforeSave: false });

  return {
    secret,
    otpauth_url: `otpauth://totp/GreenPay:${user.email}?secret=${secret}&issuer=GreenPay`
  };
};

// ==========================================
// REVISI FITUR: VERIFIKASI TOKEN TOTP (FIXED DECODER)
// ==========================================
// exports.verify2FAToken = async (userId, token) => {
//   const user = await User.findById(userId).select('+two_factor_secret');
//   if (!user || !user.two_factor_secret) {
//     throw new AppError('Aktivasi 2FA belum diinisialisasi pada akun ini.', StatusCodes.BAD_REQUEST);
//   }

//   const counter = Math.floor(Date.now() / 80000);
  
//   // PERBAIKAN FATAL: Membongkar string Base32 kembali menjadi Buffer byte asli
//   const secretBuffer = base32Decode(user.two_factor_secret);

//   let isValid = false;
//   for (let i = -1; i <= 1; i++) {
//     const timeBuffer = Buffer.alloc(8);
//     timeBuffer.writeUInt32BE(counter + i, 4);

//     const hmac = crypto.createHmac('sha1', secretBuffer).update(timeBuffer).digest();
//     const offset = hmac[hmac.length - 1] & 0xf;
//     const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');

//     if (code === token) {
//       isValid = true;
//       break;
//     }
//   }

//   if (!isValid) throw new AppError('Kode otentikasi 2FA tidak valid atau kadaluwarsa.', StatusCodes.UNAUTHORIZED);

//   if (!user.two_factor_enabled) {
//     user.two_factor_enabled = true;
//     await user.save({ validateBeforeSave: false });
//     console.log(`🛡️  [2FA LOCKED] Proteksi lapis baja resmi aktif untuk User ID: ${userId}`);
//   }

//   return true;
// };

exports.verify2FAToken = async (userId, token) => {
  const user = await User.findById(userId).select('+two_factor_secret');
  if (!user || !user.two_factor_secret) {
    throw new AppError('Aktivasi 2FA belum diinisialisasi pada akun ini.', StatusCodes.BAD_REQUEST);
  }

  const counter = Math.floor(Date.now() / 30000);
  const secretBuffer = base32Decode(user.two_factor_secret);

  // [CLEAN CODE] Tarik toleransi jendela dari .env, default 1 jika tidak diset
  const windowSteps = parseInt(process.env.TOTP_WINDOW_STEPS, 10) || 1;
  
  let isValid = false;

  // Jendela pencarian bergerak dinamis mengikuti konfigurasi environment
  for (let i = -windowSteps; i <= windowSteps; i++) {
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(counter + i, 4);

    const hmac = crypto.createHmac('sha1', secretBuffer).update(timeBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');

    if (code === token) {
      isValid = true;
      break;
    }
  }

  if (!isValid) throw new AppError('Kode otentikasi 2FA tidak valid atau kadaluwarsa.', StatusCodes.UNAUTHORIZED);

  if (!user.two_factor_enabled) {
    user.two_factor_enabled = true;
    await user.save({ validateBeforeSave: false });
    console.log(`🛡️  [2FA LOCKED] Proteksi resmi aktif untuk User ID: ${userId}`);
  }

  return true;
};

// ==========================================
// FITUR: VERIFIKASI 2FA SAAT LOGIN (TUKAR PRE-AUTH TICKET)
// ==========================================
exports.verify2FALogin = async (preAuthToken, totpCode) => {
  if (!preAuthToken || !totpCode) {
    throw new AppError('Tiket pra-autentikasi dan kode 2FA wajib diisi.', StatusCodes.BAD_REQUEST);
  }

  let decoded;
  try {
    decoded = verifyPreAuthToken(preAuthToken);
  } catch (error) {
    throw new AppError('Tiket 2FA tidak valid atau telah kedaluwarsa. Silakan login ulang.', StatusCodes.UNAUTHORIZED);
  }

  if (!decoded || decoded.stage !== '2fa_pending') {
    throw new AppError('Tiket 2FA tidak valid atau telah kedaluwarsa. Silakan login ulang.', StatusCodes.UNAUTHORIZED);
  }

  const user = await User.findById(decoded.id).select('+two_factor_secret +two_factor_enabled');
  if (!user || !user.two_factor_enabled || !user.two_factor_secret) {
    throw new AppError('Konfigurasi 2FA akun tidak valid.', StatusCodes.BAD_REQUEST);
  }

  const counter = Math.floor(Date.now() / 30000);
  const secretBuffer = base32Decode(user.two_factor_secret);
  const windowSteps = parseInt(process.env.TOTP_WINDOW_STEPS, 10) || 1;

  let isValid = false;
  for (let i = -windowSteps; i <= windowSteps; i++) {
    const timeBuffer = Buffer.alloc(8);
    timeBuffer.writeUInt32BE(counter + i, 4);

    const hmac = crypto.createHmac('sha1', secretBuffer).update(timeBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');

    if (code === totpCode) {
      isValid = true;
      break;
    }
  }

  if (!isValid) {
    throw new AppError('Kode otentikasi 2FA salah atau kedaluwarsa.', StatusCodes.UNAUTHORIZED);
  }

  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    user_id: user._id,
    token: refreshToken,
    expires_at: expiresAt
  });

  user.two_factor_secret = undefined;

  return { user, accessToken, refreshToken };
};

// ==========================================
// FITUR BARU: ROTASI / REFRESH ACCESS TOKEN
// ==========================================
exports.refreshAccessToken = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) {
    throw new AppError('Refresh token wajib disertakan.', StatusCodes.BAD_REQUEST);
  }

  // 1. Cek keberadaan Refresh Token di Database
  const storedToken = await RefreshToken.findOne({ 
    token: incomingRefreshToken,
    expires_at: { $gt: Date.now() }
  });

  if (!storedToken) {
    throw new AppError('Refresh token tidak valid atau telah kedaluwarsa. Silakan login kembali.', StatusCodes.UNAUTHORIZED);
  }

  // 2. Verifikasi Kriptografi Refresh Token
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    // Jika token palsu/rusak, hapus dari DB
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new AppError('Verifikasi refresh token gagal.', StatusCodes.UNAUTHORIZED);
  }

  // 3. Pastikan User pemilik token masih ada
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('Pengguna pemilik token ini tidak ditemukan.', StatusCodes.UNAUTHORIZED);
  }

  // 4. Terbitkan ACCESS TOKEN BARU (15 Menit Baru)
  const newAccessToken = signAccessToken(user._id, user.role);

  return { accessToken: newAccessToken };
};

// ==========================================
// REFAKTOR: LOGOUT ENGINE (DESTROY REFRESH TOKEN)
// ==========================================
exports.logoutUser = async (incomingRefreshToken) => {
  if (incomingRefreshToken) {
    // Hapus paspor Refresh Token dari Database -> Sesi resmi dimatikan!
    await RefreshToken.deleteOne({ token: incomingRefreshToken });
    console.log('🔒 [AUTH SERVICE] Refresh Token dihancurkan dari database.');
  }
  return true;
};