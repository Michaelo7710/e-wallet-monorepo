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


const { AdminBank, TopUpRequest, Wallet, Transaction, User } = require('../models');
const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');
const paymentService = require('./paymentService');



// ========================================================
// A. CRUD ENGINE: MANAJEMEN REKENING PLATFORM (ADMIN BANK)
// ========================================================
exports.createBank = async (bankData) => {
  return await AdminBank.create(bankData);
};

exports.getAllBanks = async () => {
  return await AdminBank.find().sort({ createdAt: -1 });
};

exports.updateBank = async (bankId, updateData) => {
  const bank = await AdminBank.findByIdAndUpdate(bankId, updateData, {
    returnDocument: 'after',
    runValidators: true
  });
  if (!bank) throw new AppError('Rekening master tidak ditemukan.', StatusCodes.NOT_FOUND);
  return bank;
};

exports.deleteBank = async (bankId) => {
  const bank = await AdminBank.findByIdAndDelete(bankId);
  if (!bank) throw new AppError('Rekening master tidak ditemukan.', StatusCodes.NOT_FOUND);
  return { message: 'Rekening master platform berhasil dihapus.' };
};

// ========================================================
// B. MAKER-CHECKER ENGINE: MANAJEMEN TOP UP USER
// ========================================================
exports.getPendingTopUps = async () => {
  return await TopUpRequest.find({ status: 'pending' })
    .populate('user_id', 'username email')
    .sort({ createdAt: 1 });
};

exports.processTopUpDecision = async (topUpId, adminId, decision) => {
  const request = await TopUpRequest.findById(topUpId);
  if (!request) throw new AppError('Permintaan top up tidak ditemukan.', StatusCodes.NOT_FOUND);
  if (request.status !== 'pending') throw new AppError('Transaksi ini sudah diproses dan bersifat final.', StatusCodes.BAD_REQUEST);

  // Deteksi Topologi Dinamis lokal standalone vs cloud cluster
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

    if (decision === 'approve') {
      request.status = 'success';
      request.admin_id = adminId;
      await request.save(options);

      // Kreditkan saldo ke dompet pengguna
      const wallet = await Wallet.findOne({ user_id: request.user_id }).session(session);
      if (!wallet) throw new AppError('Wallet pengguna tidak ditemukan.', StatusCodes.NOT_FOUND);
      
      wallet.balance += request.amount;
      await wallet.save(options);

      // Catat rekam jejak resmi ke Jurnal Buku Besar (Transaction)
      await Transaction.create([{
        reference_id: request._id,
        reference_model: 'TopUpRequest',
        sender_id: null,
        receiver_id: request.user_id,
        amount: request.amount,
        type: 'topup'
      }], options);

    } else if (decision === 'cancel') {
      request.status = 'cancel';
      request.admin_id = adminId;
      await request.save(options);
    }

    await session?.commitTransaction();
    session?.endSession();
    return request;
  } catch (error) {
    await session?.abortTransaction();
    session?.endSession();
    throw error;
  }
};

exports.deleteTopUpRecord = async (topUpId) => {
  const request = await TopUpRequest.findById(topUpId);
  if (!request) throw new AppError('Data tidak ditemukan.', StatusCodes.NOT_FOUND);
  
  // Aturan Ketat Dokumen: Hanya status success atau cancel yang boleh dihapus
  if (request.status === 'pending') {
    throw new AppError('Transaksi berstatus pending tidak boleh dihapus demi integritas data keuangan.', StatusCodes.BAD_REQUEST);
  }

  await TopUpRequest.findByIdAndDelete(topUpId);
  return { message: 'Rekam riwayat transaksi top up berhasil dibersihkan.' };
};

// ========================================================
// C. LOGIKA MONITORING: ANTREAN DANA TERTANAH (WITHDRAWAL)
// ========================================================

exports.getPendingWithdrawals = async () => {
  console.log('🛡️  [ADMIN SERVICE] Mengaudit antrean transfer bank bernilai tinggi (Pending Approval).');
  // Menampilkan permohonan yang berstatus pending_approval dan diurutkan dari yang paling lama mengantre
  return await WithdrawalRequest.find({ status: 'pending_approval' })
    .populate('user_id', 'username email phone_number') // Deteksi identitas pemilik dana
    .sort({ createdAt: 1 });
};

exports.executeKliringDecision = async (withdrawalId, adminId, decision, rejectedReason) => {
  // Panggil kembali fungsi core-banking hibrida berjaminan fail-safe dari paymentService
  return await paymentService.processAdminDecision(withdrawalId, adminId, decision, rejectedReason);
};

// ========================================================
// D. METRIK KEUANGAN: LIVE LEDGER AGGREGATION EXPRESS
// ========================================================
exports.getFinancialDashboard = async (filterType = 'daily', year = 2026, month) => {
  console.log(`📊 [FINANCIAL DASHBOARD] Menghitung neraca saldo. Filter: ${filterType}`);

  // 1. Hitung Total Uang Aktual yang Beredar di dalam Sistem (Liabilitas Dompet)
  const totalWalletAggregation = await Wallet.aggregate([
    { $group: { _id: null, totalSystemMoney: { $sum: '$balance' } } }
  ]);
  const totalSystemMoney = totalWalletAggregation[0]?.totalSystemMoney || 0;

  // 2. Tentukan Rentang Waktu Pencarian Dinamis berdasarkan Kalender 2026
  const startDate = new Date(year, month ? month - 1 : 0, 1);
  let endDate = new Date(year, month ? month : 12, 1);

  if (filterType === 'daily') {
    // Jika filter harian, kita persempit pencarian ke hari ini di tahun 2026
    const today = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);
  }

  const timeBoundary = { $gte: startDate, $lt: endDate };

  // 3. Hitung Arus Uang Masuk (Inflow: Top Up Sukses)
  const inflowAggregation = await Transaction.aggregate([
    { $match: { type: 'topup', createdAt: timeBoundary } },
    { $group: { _id: null, totalInflow: { $sum: '$amount' } } }
  ]);

  // 4. Hitung Arus Uang Keluar (Outflow: Withdrawal Sukses)
  const outflowAggregation = await Transaction.aggregate([
    { $match: { type: 'withdrawal', createdAt: timeBoundary } },
    { $group: { _id: null, totalOutflow: { $sum: '$amount' } } }
  ]);

  return {
    total_money_in_system: totalSystemMoney,
    inflow: inflowAggregation[0]?.totalInflow || 0,
    outflow: outflowAggregation[0]?.totalOutflow || 0,
    meta: {
      filter_applied: filterType,
      range_start: startDate,
      range_end: endDate
    }
  };
};

// ========================================================
// E. LOGIKA KLIRING: APPROVAL TRANSFER NOMINAL BESAR (>= 10JT)
// ========================================================

exports.getPendingTransfers = async () => {
  console.log('🔍 [ADMIN SERVICE] Menarik antrean transfer bernilai tinggi (Pending Approval)...');
  
  return await Transaction.find({ type: 'transfer', status: 'pending_approval' })
    .populate('sender_id', 'username email phone_number')
    .populate('receiver_id', 'username email phone_number')
    .sort({ created_at: 1 });
};

exports.processTransferDecision = async (transactionId, adminId, decision, rejectedReason = null) => {
  console.log(`🎮 [ADMIN DECISION] Admin ID: ${adminId} mengeksekusi keputusan [${decision}] pada transfer ID: ${transactionId}`);

  // 1. Cari dokumen transaksi P2P yang tertahan
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw new AppError('Dokumen transaksi transfer tidak ditemukan.', StatusCodes.NOT_FOUND);
  }

  if (transaction.type !== 'transfer' || transaction.status !== 'pending_approval') {
    throw new AppError('Transaksi ini bukan transfer tertunda atau sudah diproses sebelumnya.', StatusCodes.BAD_REQUEST);
  }

  // 2. Deteksi Topologi Transaksi Database Atomik (ACID)
  let useTransaction = process.env.USE_TRANSACTIONS === 'true';
  const topologyType = mongoose.connection.client?.topology?.description?.type;
  if (topologyType === 'Single' || topologyType === 'Unknown') {
    useTransaction = false;
  }

  let session = null;
  if (useTransaction) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    const options = session ? { session } : {};

    if (decision === 'approve') {
      // KONDISI A: DISETUJUI -> Tambah saldo dompet penerima
      const receiverWallet = await Wallet.findOne({ user_id: transaction.receiver_id }).session(session);
      if (!receiverWallet) {
        throw new AppError('Dompet pengguna penerima tidak ditemukan.', StatusCodes.NOT_FOUND);
      }

      receiverWallet.balance += transaction.amount;
      await receiverWallet.save(options);

      transaction.status = 'success';
      await transaction.save(options);

      console.log(`✅ [TRANSFER APPROVED] Dana Rp ${transaction.amount} resmi diteruskan ke penerima.`);

    } else if (decision === 'reject') {
      // KONDISI B: DITOLAK -> Pulangkan saldo (Refund) ke dompet pengirim
      const senderWallet = await Wallet.findOne({ user_id: transaction.sender_id }).session(session);
      if (!senderWallet) {
        throw new AppError('Dompet pengguna pengirim tidak ditemukan saat proses refund.', StatusCodes.NOT_FOUND);
      }

      senderWallet.balance += transaction.amount; // Uang dipulangkan ke pengirim
      await senderWallet.save(options);

      transaction.status = 'rejected';
      await transaction.save(options);

      console.log(`🔴 [TRANSFER REJECTED] Transfer dibatalkan Admin. Dana Rp ${transaction.amount} dipulangkan ke pengirim.`);
    }

    await session?.commitTransaction();
    session?.endSession();

    return transaction;

  } catch (error) {
    console.error('💥 [ADMIN TRANSFER DECISION CRASH] Menggagalkan keputusan kliring transfer:', error.message);
    await session?.abortTransaction();
    session?.endSession();
    throw error;
  }
};