const { StatusCodes } = require('http-status-codes');
const paymentService = require('../services/paymentService');
const catchAsync = require('../utils/catchAsync');

// ========================================================
// 1. KENDALI: INISIALISASI PERMINTAAN TOP UP (CLIENT TO SERVER)
// ========================================================
exports.initiateTopUp = catchAsync(async (req, res, next) => {
  // ID Pengguna diekstrak secara otomatis dari KTP Digital oleh middleware 'protect'
  const userId = req.user._id; 
  const { amount } = req.body;

  console.log(`🎮 [CONTROLLER PAY] Menerima request Top Up dari User: ${req.user.email} sebesar: Rp ${amount}`);

  // Eksekusi core business logic di service layer
  const result = await paymentService.initiateTopUp(userId, amount);

  // Kembalikan respon sukses membawa token SNAP untuk dieksekusi Frontend Mobile
  res.status(StatusCodes.CREATED).json({
    status: 'success',
    message: 'Token pembayaran SNAP Midtrans berhasil diterbitkan.',
    data: result
  });
});

// ========================================================
// 2. KENDALI: WEBHOOK NOTIFIKASI ASINKRONUS (SERVER TO SERVER)
// ========================================================
exports.handleMidtransWebhook = catchAsync(async (req, res, next) => {
  console.log('🎮 [CONTROLLER PAY] Sinyal Webhook Midtrans terdeteksi mengetuk pintu server...');

  // Kirim seluruh body notifikasi dari Midtrans ke Service Layer untuk audit signature SHA-512
  await paymentService.handleMidtransWebhook(req.body);

  // ATURAN SAKRAL MIDTRANS: Wajib mengembalikan respon 200 OK dengan body sukses 
  // sebagai sinyal ke server Midtrans bahwa rekonsiliasi data di sistem kita selesai total.
  // Jika tidak, Midtrans akan terus menembak webhook kita berulang kali (retry mechanism).
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Webhook notifikasi diproses dan rekonsiliasi saldo berhasil diamankan.'
  });
});


exports.requestWithdrawal = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  
  console.log(`🎮 [CONTROLLER PAY] Membuka sirkuit penarikan outbound untuk: ${req.user.email}`);

  // Oper payload data body dari Postman ke Service Layer
  const result = await paymentService.requestWithdrawal(userId, req.body);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: result.is_high_value 
      ? 'Permintaan nominal besar berhasil diamankan. Menunggu persetujuan dokumen oleh Admin.'
      : 'Penarikan dana bernilai kecil sukses diproses secara instan.',
    data: result
  });
});

// ========================================================
// 4. KENDALI: PEER-TO-PEER INTERNAL TRANSFER (USER SIDE)
// ========================================================
exports.transferP2P = catchAsync(async (req, res, next) => {
  const senderId = req.user._id; // Identitas aman hasil ekstrak middleware protect

  console.log(`🎮 [CONTROLLER PAY] User ${req.user.email} mengeksekusi sirkuit internal P2P.`);

  const result = await paymentService.transferP2P(senderId, req.body);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Transfer saldo sesama pengguna GreenPay berhasil diselesaikan.',
    data: result
  });
});

// ========================================================
// 5. KENDALI: AGGREGATOR RIWAYAT MUTASI BUKU BESAR (USER SIDE)
// ========================================================
exports.getTransactionHistory = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  console.log(`🎮 [CONTROLLER PAY] User ${req.user.email} meminta penarikan data riwayat mutasi.`);

  //req.query menampung parameter url seperti ?page=1&limit=5&type=transfer
  const result = await paymentService.getTransactionHistory(userId, req.query);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Buku besar mutasi berhasil diagregasi dan diselaraskan.',
    metadata: result.metadata,
    data: result.records
  });
});