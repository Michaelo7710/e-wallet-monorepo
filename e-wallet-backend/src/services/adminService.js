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
// A. MANAJEMEN REKENING PLATFORM (ADMIN BANK)
// ========================================================

exports.createBank = async (bankData) => {
  const payload = {
    bank_name: bankData.bank_name,
    account_number: bankData.account_number,
    account_name:
      bankData.account_name || bankData.account_holder_name,
  };

  return AdminBank.create(payload);
};

exports.getAllBanks = async () => {
  return AdminBank.find()
    .sort({ createdAt: -1 })
    .lean();
};

exports.updateBank = async (bankId, updateData) => {
  const bank = await AdminBank.findByIdAndUpdate(
    bankId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!bank) {
    throw new AppError(
      'Rekening master tidak ditemukan.',
      StatusCodes.NOT_FOUND
    );
  }

  return bank;
};

exports.deleteBank = async (bankId) => {
  const bank = await AdminBank.findByIdAndDelete(bankId);

  if (!bank) {
    throw new AppError(
      'Rekening master tidak ditemukan.',
      StatusCodes.NOT_FOUND
    );
  }

  return {
    message: 'Rekening master platform berhasil dihapus.',
  };
};

// ========================================================
// B. MANAJEMEN TOP UP USER
// ========================================================

exports.getPendingTopUps = async () => {
  return TopUpRequest.find({
    status: 'pending',
    deleted_at: null,
  })
    .populate('user_id', 'username email phone_number')
    .populate(
      'admin_bank_id',
      'bank_name account_number account_name'
    )
    .sort({ createdAt: 1 })
    .lean();
};

exports.processTopUpDecision = async (
  topUpId,
  adminId,
  decision
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

      const walletQuery = Wallet.findOne({
        user_id: request.user_id,
      });

      if (session) {
        walletQuery.session(session);
      }

      const wallet = await walletQuery;

      if (!wallet) {
        throw new AppError(
          'Wallet pengguna tidak ditemukan.',
          StatusCodes.NOT_FOUND
        );
      }

      wallet.balance += request.amount;

      await wallet.save(options);

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
    }

    if (decision === 'cancel') {
      request.status = 'cancel';
      request.admin_id = adminId;

      await request.save(options);
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

exports.deleteTopUpRecord = async (topUpId) => {
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

  return {
    message:
      'Rekam riwayat transaksi top up berhasil dibersihkan (Soft Delete).',
  };
};

// ========================================================
// C. MONITORING WITHDRAWAL
// ========================================================

exports.getPendingWithdrawals = async () => {
  return WithdrawalRequest.find({
    status: 'pending_approval',
  })
    .populate('user_id', 'username email phone_number')
    .sort({ createdAt: 1 })
    .lean();
};

exports.executeKliringDecision = async (
  withdrawalId,
  adminId,
  decision,
  rejectedReason
) => {
  return paymentService.processAdminDecision(
    withdrawalId,
    adminId,
    decision,
    rejectedReason
  );
};

// ========================================================
// D. DASHBOARD KEUANGAN
// ========================================================

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
  // 3. Filter berdasarkan created_at / createdAt
  // ------------------------------------------------------

  const timeBoundary = {
    $or: [
      {
        created_at: {
          $gte: startDate,
          $lt: endDate,
        },
      },
      {
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    ],
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

exports.getPendingTransfers = async () => {
  return Transaction.find({
    type: 'transfer',
    status: 'pending_approval',
  })
    .populate('sender_id', 'username email phone_number')
    .populate('receiver_id', 'username email phone_number')
    .sort({ created_at: 1 })
    .lean();
};

exports.processTransferDecision = async (
  transactionId,
  adminId,
  decision,
  rejectedReason = null
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
      const receiverWalletQuery = Wallet.findOne({
        user_id: transaction.receiver_id,
      });

      if (session) {
        receiverWalletQuery.session(session);
      }

      const receiverWallet = await receiverWalletQuery;

      if (!receiverWallet) {
        throw new AppError(
          'Dompet pengguna penerima tidak ditemukan.',
          StatusCodes.NOT_FOUND
        );
      }

      receiverWallet.balance += transaction.amount;

      await receiverWallet.save(options);

      transaction.status = 'success';

      await transaction.save(options);
    }

    if (decision === 'reject') {
      const senderWalletQuery = Wallet.findOne({
        user_id: transaction.sender_id,
      });

      if (session) {
        senderWalletQuery.session(session);
      }

      const senderWallet = await senderWalletQuery;

      if (!senderWallet) {
        throw new AppError(
          'Dompet pengguna pengirim tidak ditemukan saat proses refund.',
          StatusCodes.NOT_FOUND
        );
      }

      senderWallet.balance += transaction.amount;

      await senderWallet.save(options);

      transaction.status = 'rejected';

      // Jika schema Transaction memiliki field ini,
      // simpan informasi admin dan alasan penolakan.
      transaction.admin_id = adminId;
      transaction.rejected_reason = rejectedReason;

      await transaction.save(options);
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
