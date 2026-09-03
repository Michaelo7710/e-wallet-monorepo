const { StatusCodes } = require('http-status-codes');
const adminService = require('../services/adminService');
const catchAsync = require('../utils/catchAsync');

// ========================================================
// A. CONTROLLER: MANAJEMEN REKENING BANK PLATFORM (CRUD)
// ========================================================

exports.createAdminBank = catchAsync(async (req, res, next) => {
  const bank = await adminService.createBank(req.body);
  res.status(StatusCodes.CREATED).json({
    status: 'success',
    message: 'Rekening master baru platform berhasil didaftarkan.',
    data: bank
  });
});

exports.getAllAdminBanks = catchAsync(async (req, res, next) => {
  const banks = await adminService.getAllBanks();
  res.status(StatusCodes.OK).json({
    status: 'success',
    results: banks.length,
    data: banks
  });
});

exports.updateAdminBank = catchAsync(async (req, res, next) => {
  const updatedBank = await adminService.updateBank(req.params.id, req.body);
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Data rekening master berhasil diperbarui.',
    data: updatedBank
  });
});

exports.deleteAdminBank = catchAsync(async (req, res, next) => {
  const result = await adminService.deleteBank(req.params.id);
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: result.message
  });
});

// ========================================================
// B. CONTROLLER: MAKER-CHECKER MANAJEMEN TOP UP USER
// ========================================================

exports.getPendingTopUps = catchAsync(async (req, res, next) => {
  const { cursor, limit } = req.query;
  const result = await adminService.getPendingTopUps(cursor, limit);
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Daftar antrean berhasil ditarik.',
    data: result.items,
    meta: {
      next_cursor: result.next_cursor,
      has_more: result.has_more,
      limit: parseInt(limit, 10) || 10
    }
  });
});

exports.approveTopUp = catchAsync(async (req, res, next) => {
  const adminId = req.user._id;
  const result = await adminService.processTopUpDecision(req.params.id, adminId, 'approve');
  
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Permohonan Top Up disetujui. Saldo resmi masuk ke dompet pengguna.',
    data: result
  });
});

exports.cancelTopUp = catchAsync(async (req, res, next) => {
  const adminId = req.user._id;
  const result = await adminService.processTopUpDecision(req.params.id, adminId, 'cancel');

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Permohonan Top Up berhasil dibatalkan.',
    data: result
  });
});

exports.deleteTopUpRecord = catchAsync(async (req, res, next) => {
  const result = await adminService.deleteTopUpRecord(req.params.id);
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: result.message
  });
});

// ========================================================
// C. CONTROLLER: MANAJEMEN PENARIKAN DANA (WITHDRAWAL)
// ========================================================

exports.getPendingWithdrawals = catchAsync(async (req, res, next) => {
  const { cursor, limit } = req.query;
  const result = await adminService.getPendingWithdrawals(cursor, limit);
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Daftar antrean berhasil ditarik.',
    data: result.items,
    meta: {
      next_cursor: result.next_cursor,
      has_more: result.has_more,
      limit: parseInt(limit, 10) || 10
    }
  });
});

exports.approveWithdrawal = catchAsync(async (req, res, next) => {
  const adminId = req.user._id;
  const result = await adminService.executeKliringDecision(req.params.id, adminId, 'approve');
  
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Penarikan disetujui. Dana resmi keluar dari ekosistem.',
    data: result
  });
});

exports.rejectWithdrawal = catchAsync(async (req, res, next) => {
  const adminId = req.user._id;
  const { rejected_reason } = req.body;
  const result = await adminService.executeKliringDecision(req.params.id, adminId, 'reject', rejected_reason);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Penarikan ditolak. Saldo dipulangkan ke dompet pengguna.',
    data: result
  });
});

// ========================================================
// D. CONTROLLER: METRIK & NERACA KEUANGAN DASHBOARD ADMIN
// ========================================================

exports.getFinancialReport = catchAsync(async (req, res, next) => {
  // Menangkap query URL: ?filter=daily atau ?filter=monthly&month=7
  const { filter, month } = req.query;
  const report = await adminService.getFinancialDashboard(filter, 2026, month);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Agregasi laporan keuangan sistem berhasil ditarik.',
    data: report
  });
});

// ========================================================
// E. CONTROLLER: MANAJEMEN KLIRING TRANSFER NOMINAL BESAR
// ========================================================

exports.getPendingTransfers = catchAsync(async (req, res, next) => {
  const { cursor, limit } = req.query;
  const result = await adminService.getPendingTransfers(cursor, limit);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Daftar antrean berhasil ditarik.',
    data: result.items,
    meta: {
      next_cursor: result.next_cursor,
      has_more: result.has_more,
      limit: parseInt(limit, 10) || 10
    }
  });
});

exports.approveTransfer = catchAsync(async (req, res, next) => {
  const adminId = req.user._id;
  const result = await adminService.processTransferDecision(req.params.id, adminId, 'approve');

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Transfer disetujui. Dana resmi dikreditkan ke penerima.',
    data: result
  });
});

exports.rejectTransfer = catchAsync(async (req, res, next) => {
  const adminId = req.user._id;
  const { rejected_reason } = req.body;
  const result = await adminService.processTransferDecision(req.params.id, adminId, 'reject', rejected_reason);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Transfer ditolak Admin. Dana telah dipulangkan ke pengirim.',
    data: result
  });
});