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
// 6. KENDALI: UPGRADE VERIFIKASI AKUN PREMIUM (KYC SIMULATION)
// ========================================================
exports.updateKYC = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { nik } = req.body;

  console.log(`🎮 [USER CONTROLLER] Eksekusi simulasi validasi identitas NIK.`);
  const user = await userService.updateKYC(userId, nik);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Akun Anda resmi ditingkatkan menjadi status Terverifikasi Premium.',
    data: {
      username: user.username,
      nik: user.nik,
      is_verified: user.is_verified
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