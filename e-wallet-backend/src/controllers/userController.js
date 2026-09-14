const { StatusCodes } = require('http-status-codes');
const userService = require('../services/userService');
const catchAsync = require('../utils/catchAsync');

// ========================================================
// 1. KENDALI: AMBIL PROFIL & DEPOSITO SALDO DOMPET
// ========================================================
exports.getMe = catchAsync(async (req, res, next) => {
  const userId = req.user._id; // Diekstrak aman dari token JWT oleh middleware protect
  
  console.log(`🎮 [USER CONTROLLER] Membuka data dasbor profil untuk: ${req.user.email}`);
  const result = await userService.getUserProfile(userId);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Data profil dan informasi saldo berhasil diselaraskan.',
    data: result
  });
});

// ========================================================
// 2. KENDALI: AKTIVASI PIN TRANSAKSI PERDANA
// ========================================================
exports.setupPin = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { pin } = req.body;

  console.log(`🎮 [USER CONTROLLER] Menjalankan perintah setup PIN baru.`);
  const result = await userService.setupPin(userId, pin);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: result.message
  });
});

// ========================================================
// 3. KENDALI: UBAH KATA SANDI (PASSWORD UPDATE)
// ========================================================
exports.updatePassword = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  console.log(`🎮 [USER CONTROLLER] Request modifikasi password terdeteksi.`);
  const result = await userService.updatePassword(userId, req.body);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: result.message
  });
});

// ========================================================
// 4. KENDALI: UBAH EMAIL BERPROTEKSI PIN & OTP
// ========================================================
exports.updateEmailSecurely = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  console.log(`🎮 [USER CONTROLLER] Mengirim permintaan pembaharuan email aman.`);
  const result = await userService.updateEmailSecurely(userId, req.body);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: result.message,
    email: result.email
  });
});

// ========================================================
// 5. KENDALI: UBAH PIN BERPROTEKSI PIN LAMA & OTP
// ========================================================
exports.updatePinSecurely = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  console.log(`🎮 [USER CONTROLLER] Mengirim permohonan pemutakhiran PIN transaksi.`);
  const result = await userService.updatePinSecurely(userId, req.body);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: result.message
  });
});

// ========================================================
// 6. KENDALI: UPGRADE VERIFIKASI AKUN PREMIUM (KYC MULTI-FACTOR)
// ========================================================
exports.updateKYC = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  console.log(`🎮 [USER CONTROLLER] Eksekusi validasi KYC & pengajuan akun premium.`);
  const user = await userService.updateKYC(userId, req.body);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Akun Anda resmi ditingkatkan menjadi status Terverifikasi Premium.',
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      phone_number: user.phone_number,
      role: user.role,
      nik: user.nik,
      id_card_photo: user.id_card_photo,
      bio: user.bio,
      is_verified: user.is_verified,
      is_kyc_verified: user.is_kyc_verified,
      is_email_verified: user.is_email_verified,
      account_tier: user.account_tier,
      balance: user.balance,
      two_factor_enabled: user.two_factor_enabled,
      has_pin: Boolean(user.pin)
    }
  });
});

// ========================================================
// KENDALI: PENARIKAN DAFTAR KONTAK TERPANTAU
// ========================================================
exports.getSavedContacts = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  console.log(`🎮 [USER CONTROLLER] Meminta daftar kontak tersimpan untuk: ${req.user.email}`);
  const contacts = await userService.getSavedContacts(userId);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Daftar kontak tujuan transfer berhasil ditarik.',
    results: contacts.length,
    data: contacts
  });
});