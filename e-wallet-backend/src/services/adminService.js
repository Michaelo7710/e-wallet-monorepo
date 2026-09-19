// const { AdminBank, WithdrawalRequest, User } = require('../models');
// const { StatusCodes } = require('http-status-codes');
// const AppError = require('../utils/AppError');
// const paymentService = require('./paymentService'); // Pinjam fungsi keputusan kliring penarikan

// // ========================================================
// // A. LOGIKA CRUD: MANAJEMEN REKENING PLATFORM (ADMIN BANK)
// // ========================================================

// exports.createBank = async (bankData) => {
//   console.log('🛡️  [ADMIN SERVICE] Menambahkan rekening master baru platform.');
//   return await AdminBank.create(bankData);
// };

// exports.getAllBanks = async () => {
//   console.log('🛡️  [ADMIN SERVICE] Menarik daftar seluruh rekening platform.');
//   return await AdminBank.find().sort({ createdAt: -1 });
// };

// exports.updateBank = async (bankId, updateData) => {
//   console.log(`🛡️  [ADMIN SERVICE] Memperbarui rekening ID: ${bankId}`);
//   const bank = await AdminBank.findByIdAndUpdate(bankId, updateData, {
//     new: true,
//     runValidators: true
//   });
//   if (!bank) throw new AppError('Rekening bank master tidak ditemukan.', StatusCodes.NOT_FOUND);
//   return bank;
// };

// exports.deleteBank = async (bankId) => {
//   console.log(`🛡️  [ADMIN SERVICE] Menghapus rekening ID: ${bankId}`);
//   const bank = await AdminBank.findByIdAndDelete(bankId);
//   if (!bank) throw new AppError('Rekening bank master tidak ditemukan.', StatusCodes.NOT_FOUND);
//   return { message: 'Rekening master platform berhasil dimusnahkan.' };
// };


const {
  AdminBank,
  TopUpRequest,
  Wallet,
  Transaction,
  WithdrawalRequest,
  User,
  RefreshToken,
  AdminAuditLog,
} = require('../models');

const { StatusCodes } = require('http-status-codes');
const mongoose = require('mongoose');

const AppError = require('../utils/AppError');
const paymentService = require('./paymentService');

// ========================================================
// HELPER: MONGODB TRANSACTION
// ========================================================

const isTransactionSupported = () => {
  if (process.env.USE_TRANSACTIONS !== 'true') {
    return false;
  }

  const topologyType =
    mongoose.connection.client?.topology?.description?.type;

  return topologyType !== 'Single' && topologyType !== 'Unknown';
};

const startMongoSession = async () => {
  if (!isTransactionSupported()) {
    return null;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  return session;
};

// ========================================================
// HELPER: KEYSET CURSOR PAGINATION (FIFO VIA _id)
// ========================================================

const buildCursorPagination = (cursor, limit) => {
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  const cursorFilter = {};

  if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
    cursorFilter._id = { $gt: new mongoose.Types.ObjectId(cursor) };
  }

  return { limitNum, cursorFilter };
};

const formatCursorResults = (items, limitNum) => {
  const hasMore = items.length > limitNum;
  const results = hasMore ? items.slice(0, limitNum) : items;
  const nextCursor = hasMore ? results[results.length - 1]._id.toString() : null;

  return {
    items: results,
    next_cursor: nextCursor,
    has_more: hasMore,
  };
};

// ========================================================
// HELPER: AUDIT TRAIL LOGGING
// ========================================================

const logAdminAction = async ({
  adminId,
  action,
  targetId,
  targetType,
  details = {},
  meta = {},
  session = null,
}) => {
  if (!adminId) return;

  const logPayload = {
    admin_id: adminId,
    action,
    target_id: targetId,
    target_type: targetType,
    details,
    ip_address: meta?.ip || null,
    user_agent: meta?.userAgent || null,
  };

  const options = session ? { session } : {};

  try {
    if (session) {
      await AdminAuditLog.create([logPayload], options);
    } else {
      await AdminAuditLog.create(logPayload);
    }
  } catch (err) {
    console.error('⚠️ [AUDIT LOG ERROR] Gagal mencatat log audit admin:', err.message);
    if (session) {
      throw err;
    }
  }
};

// ========================================================
// A. MANAJEMEN REKENING PLATFORM (ADMIN BANK)
// ========================================================

exports.createBank = async (bankData, adminId = null, meta = {}) => {
  const payload = {
    bank_name: bankData.bank_name,
    account_number: bankData.account_number,
    account_name:
      bankData.account_name || bankData.account_holder_name,
  };

  const bank = await AdminBank.create(payload);

  if (adminId) {
    await logAdminAction({
      adminId,
      action: 'BANK_CREATE',
      targetId: bank._id,
      targetType: 'AdminBank',
      details: {
        bank_name: bank.bank_name,
        account_number: bank.account_number,
        account_name: bank.account_name,
      },
      meta,
    });
  }

  return bank;
};

exports.getAllBanks = async () => {
  return AdminBank.find()
    .sort({ createdAt: -1 })
    .lean();
};

exports.updateBank = async (bankId, updateData, adminId = null, meta = {}) => {
  const bank = await AdminBank.findByIdAndUpdate(
    bankId,
    updateData,
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );

  if (!bank) {
    throw new AppError(
      'Rekening master tidak ditemukan.',
      StatusCodes.NOT_FOUND
    );
  }

  if (adminId) {
    await logAdminAction({
      adminId,
      action: 'BANK_UPDATE',
      targetId: bank._id,
      targetType: 'AdminBank',
      details: {
        updated_fields: Object.keys(updateData),
        bank_name: bank.bank_name,
        account_number: bank.account_number,
      },
      meta,
    });
  }

  return bank;
};

exports.deleteBank = async (bankId, adminId = null, meta = {}) => {
  const bank = await AdminBank.findByIdAndDelete(bankId);

  if (!bank) {
    throw new AppError(
      'Rekening master tidak ditemukan.',
      StatusCodes.NOT_FOUND
    );
  }

  if (adminId) {
    await logAdminAction({
      adminId,
      action: 'BANK_DELETE',
      targetId: bank._id,
      targetType: 'AdminBank',
      details: {
        bank_name: bank.bank_name,
        account_number: bank.account_number,
      },
      meta,
    });
  }

  return {
    message: 'Rekening master platform berhasil dihapus.',
  };
};

// ========================================================
// B. MANAJEMEN TOP UP USER
// ========================================================

exports.getPendingTopUps = async (cursor, limit) => {
  const { limitNum, cursorFilter } = buildCursorPagination(cursor, limit);

  const topups = await TopUpRequest.find({
    status: 'pending',
    deleted_at: null,
    ...cursorFilter,
  })
    .populate('user_id', 'username email phone_number')
    .populate(
      'admin_bank_id',
      'bank_name account_number account_name'
    )
    .sort({ _id: 1 })
    .limit(limitNum + 1)
    .lean();

  return formatCursorResults(topups, limitNum);
};

exports.processTopUpDecision = async (
  topUpId,
  adminId,
  decision,
  meta = {}
) => {
  if (!['approve', 'cancel'].includes(decision)) {
    throw new AppError(
      'Keputusan admin tidak valid. Gunakan "approve" atau "cancel".',
      StatusCodes.BAD_REQUEST
    );
  }

  const request = await TopUpRequest.findOne({
    _id: topUpId,
    deleted_at: null,
  });

  if (!request) {
    throw new AppError(
      'Permintaan top up tidak ditemukan.',
      StatusCodes.NOT_FOUND
    );
  }

  if (request.status !== 'pending') {
    throw new AppError(
      'Transaksi ini sudah diproses dan bersifat final.',
      StatusCodes.BAD_REQUEST
    );
  }

  const session = await startMongoSession();

  try {
    const options = session ? { session } : {};

    if (decision === 'approve') {
      request.status = 'success';
      request.admin_id = adminId;

      await request.save(options);

      const wallet = await Wallet.findOneAndUpdate(
        { user_id: request.user_id },
        { $inc: { balance: request.amount } },
        { returnDocument: 'after', ...options }
      );

      if (!wallet) {
        throw new AppError(
          'Wallet pengguna tidak ditemukan.',
          StatusCodes.NOT_FOUND
        );
      }

      await Transaction.create(
        [
          {
            reference_id: request._id,
            reference_model: 'TopUpRequest',
            sender_id: null,
            receiver_id: request.user_id,
            amount: request.amount,
            type: 'topup',
            is_flagged: false,
          },
        ],
        options
      );

      await logAdminAction({
        adminId,
        action: 'TOPUP_APPROVAL',
        targetId: request._id,
        targetType: 'TopUpRequest',
        details: {
          amount: request.amount,
          user_id: request.user_id,
        },
        meta,
        session,
      });
    }

    if (decision === 'cancel') {
      request.status = 'cancel';
      request.admin_id = adminId;

      await request.save(options);

      await logAdminAction({
        adminId,
        action: 'TOPUP_CANCEL',
        targetId: request._id,
        targetType: 'TopUpRequest',
        details: {
          amount: request.amount,
          user_id: request.user_id,
        },
        meta,
        session,
      });
    }

    if (session) {
      await session.commitTransaction();
    }

    return request;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

exports.deleteTopUpRecord = async (topUpId, adminId = null, meta = {}) => {
  const request = await TopUpRequest.findById(topUpId);

  if (!request) {
    throw new AppError(
      'Data transaksi tidak ditemukan.',
      StatusCodes.NOT_FOUND
    );
  }

  if (request.status === 'pending') {
    throw new AppError(
      'Transaksi berstatus pending tidak boleh dihapus demi integritas data keuangan.',
      StatusCodes.BAD_REQUEST
    );
  }

  request.deleted_at = new Date();

  await request.save();

  if (adminId) {
    await logAdminAction({
      adminId,
      action: 'TOPUP_DELETE',
      targetId: request._id,
      targetType: 'TopUpRequest',
      details: {
        amount: request.amount,
        user_id: request.user_id,
        status: request.status,
        deleted_at: request.deleted_at,
      },
      meta,
    });
  }

  return {
    message:
      'Rekam riwayat transaksi top up berhasil dibersihkan (Soft Delete).',
  };
};

// ========================================================
// C. MONITORING WITHDRAWAL
// ========================================================

exports.getPendingWithdrawals = async (cursor, limit) => {
  const { limitNum, cursorFilter } = buildCursorPagination(cursor, limit);

  const withdrawals = await WithdrawalRequest.find({
    status: 'pending_approval',
    ...cursorFilter,
  })
    .populate('user_id', 'username email phone_number')
    .sort({ _id: 1 })
    .limit(limitNum + 1)
    .lean();

  return formatCursorResults(withdrawals, limitNum);
};

exports.executeKliringDecision = async (
  withdrawalId,
  adminId,
  decision,
  rejectedReason = null,
  meta = {}
) => {
  return paymentService.processAdminDecision(
    withdrawalId,
    adminId,
    decision,
    rejectedReason,
    meta
  );
};

// ========================================================
// D. DASHBOARD KEUANGAN & EKSEKUTIF STATS
// ========================================================

exports.getDashboardStats = async () => {
  const [
    totalUsers,
    volumeAggregation,
    pendingWithdrawalsCount,
    pendingTopupsCount,
    pendingTransfersCount,
    walletAggregation,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'admin' } }),
    Transaction.aggregate([
      {
        $match: {
          type: { $in: ['transfer', 'withdrawal'] },
          status: 'success',
        },
      },
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$amount' },
        },
      },
    ]),
    WithdrawalRequest.countDocuments({ status: 'pending_approval' }),
    TopUpRequest.countDocuments({ status: 'pending', deleted_at: null }),
    Transaction.countDocuments({ type: 'transfer', status: 'pending_approval' }),
    Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalLiquidity: { $sum: '$balance' },
        },
      },
    ]),
  ]);

  return {
    total_users: totalUsers,
    total_volume: volumeAggregation[0]?.totalVolume || 0,
    pending_withdrawals_count: pendingWithdrawalsCount,
    pending_topups_count: pendingTopupsCount,
    pending_transfers_count: pendingTransfersCount,
    total_liquidity: walletAggregation[0]?.totalLiquidity || 0,
  };
};

exports.getFinancialDashboard = async (
  filterType = 'daily',
  year = new Date().getFullYear(),
  month
) => {
  // ------------------------------------------------------
  // 1. Total uang yang beredar di dalam sistem
  // ------------------------------------------------------

  const totalWalletAggregation = await Wallet.aggregate([
    {
      $group: {
        _id: null,
        totalSystemMoney: {
          $sum: '$balance',
        },
      },
    },
  ]);

  const totalSystemMoney =
    totalWalletAggregation[0]?.totalSystemMoney || 0;

  // ------------------------------------------------------
  // 2. Tentukan periode laporan
  // ------------------------------------------------------

  const targetYear = parseInt(year, 10);

  let startDate = new Date(
    targetYear,
    month ? parseInt(month, 10) - 1 : 0,
    1
  );

  let endDate = new Date(
    targetYear,
    month ? parseInt(month, 10) : 12,
    1
  );

  if (filterType === 'daily') {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
  }

  // ------------------------------------------------------
  // 3. Filter rentang waktu berdasarkan createdAt (B-Tree Indexing)
  // ------------------------------------------------------

  const timeBoundary = {
    createdAt: {
      $gte: startDate,
      $lt: endDate,
    },
  };

  // ------------------------------------------------------
  // 4. Total inflow
  // ------------------------------------------------------

  const inflowAggregation = await Transaction.aggregate([
    {
      $match: {
        type: 'topup',
        ...timeBoundary,
      },
    },
    {
      $group: {
        _id: null,
        totalInflow: {
          $sum: '$amount',
        },
      },
    },
  ]);

  // ------------------------------------------------------
  // 5. Total outflow
  // ------------------------------------------------------

  const outflowAggregation = await Transaction.aggregate([
    {
      $match: {
        type: 'withdrawal',
        ...timeBoundary,
      },
    },
    {
      $group: {
        _id: null,
        totalOutflow: {
          $sum: '$amount',
        },
      },
    },
  ]);

  return {
    total_money_in_system: totalSystemMoney,

    inflow: inflowAggregation[0]?.totalInflow || 0,

    outflow: outflowAggregation[0]?.totalOutflow || 0,

    meta: {
      filter_applied: filterType,
      range_start: startDate,
      range_end: endDate,
    },
  };
};

// ========================================================
// E. APPROVAL TRANSFER NOMINAL BESAR
// ========================================================

exports.getPendingTransfers = async (cursor, limit) => {
  const { limitNum, cursorFilter } = buildCursorPagination(cursor, limit);

  const transfers = await Transaction.find({
    type: 'transfer',
    status: 'pending_approval',
    ...cursorFilter,
  })
    .populate('sender_id', 'username email phone_number')
    .populate('receiver_id', 'username email phone_number')
    .sort({ _id: 1 })
    .limit(limitNum + 1)
    .lean();

  return formatCursorResults(transfers, limitNum);
};

exports.processTransferDecision = async (
  transactionId,
  adminId,
  decision,
  rejectedReason = null,
  meta = {}
) => {
  if (!['approve', 'reject'].includes(decision)) {
    throw new AppError(
      'Keputusan admin tidak valid. Gunakan "approve" atau "reject".',
      StatusCodes.BAD_REQUEST
    );
  }

  const transaction =
    await Transaction.findById(transactionId);

  if (!transaction) {
    throw new AppError(
      'Dokumen transaksi transfer tidak ditemukan.',
      StatusCodes.NOT_FOUND
    );
  }

  if (
    transaction.type !== 'transfer' ||
    transaction.status !== 'pending_approval'
  ) {
    throw new AppError(
      'Transaksi ini bukan transfer tertunda atau sudah diproses sebelumnya.',
      StatusCodes.BAD_REQUEST
    );
  }

  const session = await startMongoSession();

  try {
    const options = session ? { session } : {};

    if (decision === 'approve') {
      const receiverWallet = await Wallet.findOneAndUpdate(
        { user_id: transaction.receiver_id },
        { $inc: { balance: transaction.amount } },
        { returnDocument: 'after', ...options }
      );

      if (!receiverWallet) {
        throw new AppError(
          'Dompet pengguna penerima tidak ditemukan.',
          StatusCodes.NOT_FOUND
        );
      }

      transaction.status = 'success';

      await transaction.save(options);

      await logAdminAction({
        adminId,
        action: 'TRANSFER_APPROVAL',
        targetId: transaction._id,
        targetType: 'Transaction',
        details: {
          reference_number: transaction.reference_number,
          amount: transaction.amount,
          sender_id: transaction.sender_id,
          receiver_id: transaction.receiver_id,
        },
        meta,
        session,
      });
    }

    if (decision === 'reject') {
      const senderWallet = await Wallet.findOneAndUpdate(
        { user_id: transaction.sender_id },
        { $inc: { balance: transaction.amount } },
        { returnDocument: 'after', ...options }
      );

      if (!senderWallet) {
        throw new AppError(
          'Dompet pengguna pengirim tidak ditemukan saat proses refund.',
          StatusCodes.NOT_FOUND
        );
      }

      transaction.status = 'rejected';

      // Jika schema Transaction memiliki field ini,
      // simpan informasi admin dan alasan penolakan.
      transaction.admin_id = adminId;
      transaction.rejected_reason = rejectedReason;

      await transaction.save(options);

      await logAdminAction({
        adminId,
        action: 'TRANSFER_REJECT',
        targetId: transaction._id,
        targetType: 'Transaction',
        details: {
          reference_number: transaction.reference_number,
          amount: transaction.amount,
          sender_id: transaction.sender_id,
          receiver_id: transaction.receiver_id,
          rejected_reason: rejectedReason,
        },
        meta,
        session,
      });
    }

    if (session) {
      await session.commitTransaction();
    }

    return transaction;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

// ========================================================
// F. SIRKUIT ANTI-FRAUD MANAJEMEN PENGGUNA (USER GOVERNANCE)
// ========================================================

exports.getAdminUsers = async (queryParams = {}) => {
  const { search, tier, is_suspended, cursor, limit } = queryParams;

  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  const filter = {};

  // 1. Filter Search (NIK, Email, Username, Phone Number)
  if (search && typeof search === 'string' && search.trim() !== '') {
    const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(safeSearch, 'i');
    filter.$or = [
      { username: searchRegex },
      { email: searchRegex },
      { phone_number: searchRegex },
      { nik: searchRegex },
    ];
  }

  // 2. Filter Account Tier
  if (tier && ['basic', 'premium'].includes(tier)) {
    filter.account_tier = tier;
  }

  // 3. Filter Suspension Status
  if (is_suspended !== undefined && is_suspended !== '') {
    filter.is_suspended = String(is_suspended) === 'true';
  }

  // 4. Keyset Cursor Pagination (Descending order - terbaru dulu)
  if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
    filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  // Eksekusi Query Pengguna (Hilangkan field kredensial sensitif)
  const users = await User.find(filter)
    .select('-password -pin -two_factor_secret')
    .sort({ _id: -1 })
    .limit(limitNum + 1)
    .lean();

  const hasMore = users.length > limitNum;
  const results = hasMore ? users.slice(0, limitNum) : users;
  const nextCursor = hasMore ? results[results.length - 1]._id.toString() : null;

  // Optimasi 0x N+1: Tarik saldo dompet secara kolektif
  const userIds = results.map((u) => u._id);
  const wallets = await Wallet.find({ user_id: { $in: userIds } }).lean();
  const walletMap = new Map(wallets.map((w) => [w.user_id.toString(), w.balance]));

  const usersWithWallet = results.map((u) => ({
    ...u,
    balance: walletMap.get(u._id.toString()) || 0,
  }));

  return {
    users: usersWithWallet,
    next_cursor: nextCursor,
    has_more: hasMore,
  };
};

exports.freezeUser = async (userId, adminId, reason, meta = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Format ID Pengguna tidak valid.', StatusCodes.BAD_REQUEST);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('Pengguna tidak ditemukan.', StatusCodes.NOT_FOUND);
  }

  if (user.role === 'admin') {
    throw new AppError('Tidak dapat membekukan akun administrator.', StatusCodes.BAD_REQUEST);
  }

  const suspendReason = reason ? String(reason).trim() : 'Ditangguhkan oleh Administrator';
  user.is_suspended = true;
  user.suspend_reason = suspendReason;
  user.suspended_at = new Date();

  await user.save({ validateBeforeSave: false });

  // [BENTENG ANTI-FRAUD KRITIS] Musnahkan seluruh active refresh tokens sesi pengguna
  const deletedTokensResult = await RefreshToken.deleteMany({ user_id: user._id });
  console.log(`🛡️  [ANTI-FRAUD] Akun ${user.email} dibekukan. ${deletedTokensResult.deletedCount} refresh tokens dihapus.`);

  if (adminId) {
    await logAdminAction({
      adminId,
      action: 'USER_FREEZE',
      targetId: user._id,
      targetType: 'User',
      details: {
        email: user.email,
        username: user.username,
        reason: suspendReason,
        revoked_sessions_count: deletedTokensResult.deletedCount,
      },
      meta,
    });
  }

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.pin;
  delete userResponse.two_factor_secret;

  return userResponse;
};

exports.unfreezeUser = async (userId, adminId, meta = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError('Format ID Pengguna tidak valid.', StatusCodes.BAD_REQUEST);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('Pengguna tidak ditemukan.', StatusCodes.NOT_FOUND);
  }

  user.is_suspended = false;
  user.suspend_reason = null;
  user.suspended_at = null;

  await user.save({ validateBeforeSave: false });
  console.log(`🛡️  [ANTI-FRAUD] Pembekuan akun ${user.email} telah dibuka.`);

  if (adminId) {
    await logAdminAction({
      adminId,
      action: 'USER_UNFREEZE',
      targetId: user._id,
      targetType: 'User',
      details: {
        email: user.email,
        username: user.username,
      },
      meta,
    });
  }

  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.pin;
  delete userResponse.two_factor_secret;

  return userResponse;
};

// ========================================================
// G. SIRKUIT AUDIT TRAIL ADMINISTRATIF (COMPLIANCE & AUDIT)
// ========================================================

exports.getAdminAuditLogs = async (queryParams = {}) => {
  const { admin_id, action, target_type, target_id, cursor, limit } = queryParams;

  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  const filter = {};

  // 1. Filter Admin ID
  if (admin_id && mongoose.Types.ObjectId.isValid(admin_id)) {
    filter.admin_id = new mongoose.Types.ObjectId(admin_id);
  }

  // 2. Filter Action
  if (action && typeof action === 'string' && action.trim() !== '') {
    filter.action = action.trim();
  }

  // 3. Filter Target Type
  if (target_type && typeof target_type === 'string' && target_type.trim() !== '') {
    filter.target_type = target_type.trim();
  }

  // 4. Filter Target ID
  if (target_id && mongoose.Types.ObjectId.isValid(target_id)) {
    filter.target_id = new mongoose.Types.ObjectId(target_id);
  }

  // 5. Keyset Cursor Pagination (Descending order - terbaru dulu via _id)
  if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
    filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  const logs = await AdminAuditLog.find(filter)
    .populate('admin_id', 'username email role')
    .sort({ _id: -1 })
    .limit(limitNum + 1)
    .lean();

  const hasMore = logs.length > limitNum;
  const results = hasMore ? logs.slice(0, limitNum) : logs;
  const nextCursor = hasMore ? results[results.length - 1]._id.toString() : null;

  return {
    audit_logs: results,
    next_cursor: nextCursor,
    has_more: hasMore,
  };
};

