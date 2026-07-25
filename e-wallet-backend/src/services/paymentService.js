// const midtransClient = require('midtrans-client');
// const crypto = require('crypto');
// const mongoose = require('mongoose');
// const { StatusCodes } = require('http-status-codes');
// const { TopUpRequest, Wallet, Transaction, User } = require('../models');
// const AppError = require('../utils/AppError');

// // ========================================================
// // 1. INITIALIZE MIDTRANS SNAP SDK CLIENT (SANDBOX CONFIG)
// // ========================================================
// const snap = new midtransClient.Snap({
//   isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
//   serverKey: process.env.MIDTRANS_SERVER_KEY || '',
//   clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
// });

// // ========================================================
// // 2. UTILITY: GENERATOR NOMOR REFERENSI CRYTOGRAPHICALLY SECURE
// // ==========================================
// const generateReferenceNumber = () => {
//   const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // Format: YYYYMMDD
//   const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 Karakter Acak Aman Kriptografi
//   return `GP-TOPUP-${dateStr}-${randomHex}`; // Output: GP-TOPUP-20260626-A1B2C3D4
// };

// // ========================================================
// // 3. SERVICE LAYER: INITIALIZE REQUEST TOP UP (SNAP TOKEN GENERATOR)
// // ========================================================
// exports.initiateTopUp = async (userId, amount) => {
//   console.log(`🔍 [MIDTRANS INIT] Memproses permohonan token Top Up untuk User ID: ${userId} nominal: Rp ${amount}`);

//   // Guard Clause: Amankan batas minimum transaksi level database
//   if (!amount || amount < 10000) {
//     throw new AppError('Minimal pengisian saldo adalah Rp 10.000', StatusCodes.BAD_REQUEST);
//   }

//   // Ambil profil entitas pengguna secara dinamis untuk metadata kustom Midtrans
//   const user = await User.findById(userId);
//   if (!user) {
//     throw new AppError('Pengguna tidak terdaftar di dalam sistem.', StatusCodes.NOT_FOUND);
//   }

//   const referenceNumber = generateReferenceNumber();

//   // Konfigurasi Parameter Payload sesuai standarisasi Spesifikasi Midtrans SNAP API
//   const parameter = {
//     transaction_details: {
//       order_id: referenceNumber,
//       gross_amount: parseInt(amount, 10)
//     },
//     customer_details: {
//       first_name: user.username,
//       email: user.email,
//       phone: user.phone_number
//     },
//     item_details: [{
//       id: 'GP-WALLET-IN',
//       price: parseInt(amount, 10),
//       quantity: 1,
//       name: 'Top Up Saldo Dompet Digital GreenPay'
//     }],
//     // Batasi channel pembayaran secara dinamis demi efisiensi operasional dan testing lokal
//     enabled_payments: ['qris', 'gopay', 'bank_transfer', 'shopeepay', 'alfamart']
//   };

//   try {
//     console.log('   -> Membuka socket data menembak core server SNAP Midtrans...');
//     const transaction = await snap.createTransaction(parameter);
//     console.log(`✅ [MIDTRANS INIT] Token berhasil diterbitkan: ${transaction.token}`);

//     // Kunci bukti rekam jejak transaksi awal ke database lokal dengan status pending
//     await TopUpRequest.create([{
//       user_id: userId,
//       reference_number: referenceNumber,
//       payment_method: 'midtrans',
//       amount: amount,
//       status: 'pending',
//       snap_token: transaction.token
//     }]);

//     // Mengembalikan objek manifes token dan URL redirect ke controller
//     return {
//       reference_number: referenceNumber,
//       snap_token: transaction.token,
//       redirect_url: transaction.redirect_url
//     };

//   } catch (error) {
//     console.error('💥 [MIDTRANS INIT ERROR] Jembatan komunikasi SNAP API terinterupsi:', error.message);
//     throw new AppError(
//       `Gagal menginisialisasi rute pembayaran ke Midtrans: ${error.message}`,
//       StatusCodes.INTERNAL_SERVER_ERROR
//     );
//   }
// };

// // ========================================================
// // 4. SERVICE LAYER: HANDLING MIDTRANS WEBHOOK (REKONSILIASI OTOMATIS)
// // ========================================================
// exports.handleMidtransWebhook = async (notificationBody) => {
//   console.log('📡 [WEBHOOK NOTIFICATION] Menerima kiriman payload data asinkronus dari Midtrans...');

//   const {
//     order_id,
//     status_code,
//     gross_amount,
//     signature_key,
//     transaction_status,
//     fraud_status,
//     transaction_id,
//     payment_type,
//     settlement_time
//   } = notificationBody;

//   // ----------------------------------------------------------------------
//   // BENTENG KEAMANAN SAKRAL: VERIFIKASI SIGNATURE KEY SHA-512 (ANTI-PARAM TAMPERING)
//   // ----------------------------------------------------------------------
//   const localPayload = order_id + status_code + gross_amount + process.env.MIDTRANS_SERVER_KEY;
//   const computedSignature = crypto.createHash('sha512').update(localPayload).digest('hex');

//   if (computedSignature !== signature_key) {
//     console.error('🚨 [SECURITY ALERT] Tanda bahaya! Deteksi manipulasi parameter. Signature Mismatch!');
//     throw new AppError('Bukti keaslian data tidak valid forensik. Akses ditolak.', StatusCodes.BAD_REQUEST);
//   }
//   console.log('🛡️  [WEBHOOK SECURITY] Verifikasi Tanda Tangan SHA-512 dinyatakan SEHAT & VALID.');

//   // Cari manifes data topup berdasarkan nomor referensi (order_id)
//   const topUpRequest = await TopUpRequest.findOne({ reference_number: order_id });
//   if (!topUpRequest) {
//     console.warn(`🕵️ [WEBHOOK WARNING] Nomor referensi ${order_id} tidak terdaftar di sistem lokal.`);
//     return false; // Berhenti tanpa crash jika diketuk oleh data asing luar sistem
//   }

//   // Proteksi Idempotensi Finansial: Cegah pengisian saldo ganda jika webhook menembak dua kali
//   if (topUpRequest.status === 'success') {
//     console.log(`🔁 [IDEMPOTENSI ACTIVE] Transaksi ${order_id} sudah berstatus sukses sebelumnya. Prosedur diabaikan.`);
//     return true;
//   }

//   // Inisialisasi Manajemen Transaksi Database Atomik (Adaptif Standalone vs Replica Set)
//   const useTransaction = process.env.USE_TRANSACTIONS === 'true';
//   let session = null;
//   if (useTransaction) {
//     session = await mongoose.startSession();
//     session.startTransaction();
//     console.log('💎 [WEBHOOK-TRANSAKSI] Sesi ACID Mongoose diaktifkan untuk penguncian data finansial.');
//   }

//   try {
//     const options = session ? { session } : {};

//     // ----------------------------------------------------------------------
//     // MESIN NEGARA TRANSISI (FINANCIAL STATE MACHINE MATRIX)
//     // ----------------------------------------------------------------------
//     if (transaction_status === 'settlement' || (transaction_status === 'capture' && fraud_status === 'accept')) {
//       console.log(`💰 [MUTASI ELEKTRONIK] Transaksi ${order_id} VALID & SETTLED. Mengalirkan dana ke dompet...`);

//       // A. Perbarui dokumen manifest TopUpRequest lokal menjadi sukses
//       topUpRequest.status = 'success';
//       topUpRequest.midtrans_transaction_id = transaction_id;
//       topUpRequest.payment_type = payment_type;
//       topUpRequest.settled_at = settlement_time ? new Date(settlement_time) : new Date();
//       await topUpRequest.save(options);

//       // B. Eksekusi Mutasi Saldo: Tarik dompet elektronik (Wallet) target
//       const wallet = await Wallet.findOne({ user_id: topUpRequest.user_id }).session(session);
//       if (!wallet) throw new Error('Komponen dompet elektronika (Wallet) target tidak ditemukan.');

//       const oldBalance = wallet.balance;
//       wallet.balance += parseFloat(gross_amount);
//       await wallet.save(options);
//       console.log(`   -> Saldo User ${topUpRequest.user_id} bermutasi: Rp ${oldBalance} -> Rp ${wallet.balance}`);

//       // C. Suntik Bukti Hukum ke Buku Besar Mutasi Polimorfik (Transaction Ledger)
//       await Transaction.create([{
//         reference_id: topUpRequest._id,
//         reference_model: 'TopUpRequest',
//         sender_id: null, // Mengindikasikan dana masuk dari luar lingkungan sistem eksternal
//         receiver_id: topUpRequest.user_id,
//         amount: parseFloat(gross_amount),
//         type: 'topup',
//         is_flagged: false
//       }], options);

//       console.log('💾 [WEBHOOK TRANSACTION] Rangkaian mutasi mutlak committed ke ledger.');

//     } else if (['cancel', 'deny', 'expire', 'failure'].includes(transaction_status)) {
//       console.log(`❌ [TOPUP CANCELED] Transaksi ${order_id} dibatalkan otomatis dengan status Midtrans: ${transaction_status}`);
      
//       topUpRequest.status = transaction_status === 'expire' ? 'expire' : 'failed';
//       topUpRequest.midtrans_transaction_id = transaction_id;
//       await topUpRequest.save(options);
//     }

//     // Eksekusi penutupan sesi atomik database jika aktif
//     if (session) {
//       await session.commitTransaction();
//       session.endSession();
//     }
//     return true;

//   } catch (error) {
//     console.error('💥 [ALARM REKONSILIASI CRASH] Gagal mengamankan sirkuit mutasi finansial Webhook:', error.message);
//     if (session) {
//       await session.abortTransaction();
//       session.endSession();
//     }
//     throw error;
//   }
// };

const midtransClient = require('midtrans-client');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');
const { TopUpRequest, Wallet, Transaction, User, WithdrawalRequest, SavedContact } = require('../models');
const AppError = require('../utils/AppError');

// ========================================================
// 1. INITIALIZE MIDTRANS SNAP SDK CLIENT
// ========================================================
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// ========================================================
// 2. UTILITY: CRYPTOGRAPHICALLY SECURE REFERENCE GENERATOR
// ========================================================
const generateReferenceNumber = (type) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); 
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase(); 
  return `GP-${type}-${dateStr}-${randomHex}`; 
};

// ========================================================
// 3. SERVICE: INITIATE TOP UP (GENERATE SNAP TOKEN)
// ========================================================
exports.initiateTopUp = async (userId, amount) => {
  console.log(`[MIDTRANS] Initiating top-up token for User: ${userId}, Amount: ${amount}`);

  if (!amount || amount < 10000) {
    throw new AppError('Minimal pengisian saldo adalah Rp 10.000', StatusCodes.BAD_REQUEST);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('Pengguna tidak terdaftar di dalam sistem.', StatusCodes.NOT_FOUND);
  }

  const referenceNumber = generateReferenceNumber('TP');

  const parameter = {
    transaction_details: {
      order_id: referenceNumber,
      gross_amount: parseInt(amount, 10)
    },
    customer_details: {
      first_name: user.username,
      email: user.email,
      phone: user.phone_number
    },
    item_details: [{
      id: 'GP-WALLET-IN',
      price: parseInt(amount, 10),
      quantity: 1,
      name: 'Top Up Saldo Dompet Digital GreenPay'
    }],
    enabled_payments: ['qris', 'gopay', 'bank_transfer', 'shopeepay', 'alfamart']
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    console.log(`[MIDTRANS] Snap token issued successfully for Order: ${referenceNumber}`);

    // Menggunakan objek biasa {} karena tidak berada di dalam sesi transaksi ACID
    await TopUpRequest.create({
      user_id: userId,
      reference_number: referenceNumber,
      payment_method: 'midtrans',
      amount: amount,
      status: 'pending',
      snap_token: transaction.token
    });

    return {
      reference_number: referenceNumber,
      snap_token: transaction.token,
      redirect_url: transaction.redirect_url
    };

  } catch (error) {
    console.error(`[MIDTRANS ERROR] Failed to create transaction: ${error.message}`);
    throw new AppError(
      `Gagal menginisialisasi rute pembayaran ke Midtrans: ${error.message}`,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};

// ========================================================
// 4. SERVICE: HANDLING MIDTRANS WEBHOOK (AUTO-RECONCILIATION)
// ========================================================
exports.handleMidtransWebhook = async (notificationBody) => {
  console.log('[WEBHOOK] Inbound notification received from Midtrans.');

  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
    transaction_id,
    payment_type,
    settlement_time
  } = notificationBody;

  // ----------------------------------------------------------------------
  // SECURITY GATE: SIGNATURE VERIFICATION (SHA-512)
  // ----------------------------------------------------------------------
  const localPayload = order_id + status_code + gross_amount + process.env.MIDTRANS_SERVER_KEY;
  const computedSignature = crypto.createHash('sha512').update(localPayload).digest('hex');

  if (computedSignature !== signature_key) {
    console.error(`[SECURITY ALERT] Signature mismatch detected for Order: ${order_id}`);
    throw new AppError('Bukti keaslian data tidak valid. Akses ditolak.', StatusCodes.BAD_REQUEST);
  }

  const topUpRequest = await TopUpRequest.findOne({ reference_number: order_id });
  if (!topUpRequest) {
    console.warn(`[WEBHOOK] Reference number ${order_id} not registered in local system.`);
    return false; 
  }

  // Idempotency Protection: Cegah double processing
  if (topUpRequest.status === 'success') {
    console.log(`[WEBHOOK] Order ${order_id} has already been processed successfully. Skipping.`);
    return true;
  }

  // MANDATORY ACID TRANSACTION IN PRODUCTION FOR FINANCIAL INTEGRITY
 // ======================================================================
  // MANAJEMEN TRANSAKSI FAIL-SAFE (INTELLIGENT TOPOLOGY SENSOR)
  // ======================================================================
  let useTransaction = process.env.USE_TRANSACTIONS === 'true';
  
  // Sensor Otomatis: Deteksi tipe koneksi MongoDB secara real-time
  const topologyType = mongoose.connection.client?.topology?.description?.type;
  if (topologyType === 'Single' || topologyType === 'Unknown') {
    console.warn('⚠️  [SENSING PORTFOLIO] MongoDB Lokal Standalone terdeteksi. Transaksi ACID dinonaktifkan otomatis demi stabilitas RAM.');
    useTransaction = false; // Bypass paksa ke false agar tidak memicu MongoServerError
  }

  let session = null;
  if (useTransaction) {
    session = await mongoose.startSession();
    session.startTransaction();
    console.log('💎 [WEBHOOK-TRANSAKSI] Sesi ACID Mongoose diaktifkan otomatis (Cloud Cluster Detected).');
  }

  try {
    const isSettled = transaction_status === 'settlement' || 
                      (transaction_status === 'capture' && fraud_status === 'accept');

    if (isSettled) {
      console.log(`[MUTATION] Order ${order_id} is settled. Executing balance mutation...`);

      // A. Update TopUp Manifest
      topUpRequest.status = 'success';
      topUpRequest.midtrans_transaction_id = transaction_id;
      topUpRequest.payment_type = payment_type;
      topUpRequest.settled_at = settlement_time ? new Date(settlement_time) : new Date();
      await topUpRequest.save({ session });

      // B. Update Wallet (Atomic modification using session)
      const wallet = await Wallet.findOne({ user_id: topUpRequest.user_id }).session(session);
      if (!wallet) throw new Error(`Wallet not found for user ${topUpRequest.user_id}`);

      wallet.balance += parseFloat(gross_amount);
      await wallet.save({ session });

      // C. Inject Polymorphic Ledger Logs
      await Transaction.create([{
        reference_id: topUpRequest._id,
        reference_model: 'TopUpRequest',
        sender_id: null, 
        receiver_id: topUpRequest.user_id,
        amount: parseFloat(gross_amount),
        type: 'topup',
        is_flagged: false
      }], { session });

      console.log(`[MUTATION] Ledger updated. Balance successfully delivered to User: ${topUpRequest.user_id}`);

    } else if (['cancel', 'deny', 'expire', 'failure'].includes(transaction_status)) {
      console.log(`[WEBHOOK] Order ${order_id} terminated with status: ${transaction_status}`);
      
      topUpRequest.status = transaction_status === 'expire' ? 'expire' : 'failed';
      topUpRequest.midtrans_transaction_id = transaction_id;
      await topUpRequest.save({ session });
    }

    await session?.commitTransaction();
    return true;

  } catch (error) {
    console.error(`[FATAL RECONCILIATION CRASH] Aborting transaction for Order ${order_id}: ${error.message}`);
    await session?.abortTransaction();
    throw error;
  } finally {
    session?.endSession();
  }
};

// ========================================================
// 5. SERVICE LAYER: PERMINTAAN PENARIKAN DANA (USER SIDE)
// ========================================================
exports.requestWithdrawal = async (userId, withdrawalData) => {
  const { bank_name, account_number, account_name, amount } = withdrawalData;

  console.log(`🔍 [WITHDRAWAL REQUEST] Memproses intensi penarikan uang keluar untuk User: ${userId}, Nominal: Rp ${amount}`);

  // ========================================================
  // LAPISAN 1: EARLY GUARD CLAUSES (VALIDASI DI PINTU DEPAN)
  // ========================================================
  // [CLEAN CODE] Deteksi parameter wajib secara dinamis sebelum menyentuh database
  if (!bank_name || !account_number || !account_name) {
    throw new AppError(
      'Informasi transfer tidak lengkap. Nama bank, nomor rekening, dan nama pemilik wajib disertakan.',
      StatusCodes.BAD_REQUEST // 400 Bad Request (Bukan 500!)
    );
  }

  if (!amount || amount < 50000) {
    throw new AppError('Minimal penarikan saldo keluar sistem adalah Rp 50.000', StatusCodes.BAD_REQUEST);
  }

  // Tarik dompet pengguna untuk memeriksa kedaulatan saldo
  const wallet = await Wallet.findOne({ user_id: userId });
  if (!wallet) {
    throw new AppError('Komponen dompet digital Anda tidak ditemukan.', StatusCodes.NOT_FOUND);
  }

  if (wallet.balance < amount) {
    throw new AppError('Saldo dompet Anda tidak mencukupi untuk melakukan penarikan ini.', StatusCodes.BAD_REQUEST);
  }

  // ========================================================
  // LAPISAN 2: INTEGRASI INFRASTRUKTUR & EKSEKUSI MUTASI
  // ========================================================
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
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const referenceNumber = `GP-WD-${dateStr}-${randomHex}`;

    const isHighValue = amount >= 10000000;
    const initialStatus = isHighValue ? 'pending_approval' : 'success';

    // [VALIDATION FIRST] Kita buat data request TERLEBIH DAHULU. 
    // Jika baris ini gagal karena validasi Mongoose, saldo di bawah aman tidak terpotong.
    const withdrawalRequest = await WithdrawalRequest.create([{
      user_id: userId,
      reference_number: referenceNumber,
      bank_name,
      account_number,
      account_name,
      amount,
      status: initialStatus
    }], options);

    // KETIKA DOKUMEN AMAN, BARU POTONG SALDO WALLET (STATE CONSISTENCY SECURE)
    wallet.balance -= parseFloat(amount);
    await wallet.save(options);
    console.log(`   -> Saldo resmi dipotong aman. Sisa saldo saat ini: Rp ${wallet.balance}`);

    // Suntik baris riwayat ke Buku Besar jika bernilai kecil
    if (!isHighValue) {
      await Transaction.create([{
        reference_id: withdrawalRequest[0]._id,
        reference_model: 'WithdrawalRequest',
        sender_id: userId,
        receiver_id: null,
        amount: parseFloat(amount),
        type: 'withdrawal',
        is_flagged: false
      }], options);
    }

    await session?.commitTransaction();
    session?.endSession();

    return {
      reference_number: referenceNumber,
      amount,
      status: initialStatus,
      is_high_value: isHighValue
    };

  } catch (error) {
    console.error(`💥 [WITHDRAWAL CRASH] Aborting transaction for Order:`, error.message);
    await session?.abortTransaction();
    session?.endSession();
    throw error;
  }
};

// ========================================================
// 6. SERVICE LAYER: OTORITAS KLIRING ADMIN (ADMIN CHECKSIDE)
// ========================================================
exports.processAdminDecision = async (withdrawalId, adminId, decision, rejectedReason = null) => {
  console.log(`🛡️  [ADMIN DECISION] Admin ID: ${adminId} mengeksekusi keputusan [${decision}] pada dokumen: ${withdrawalId}`);

  // Cari permintaan dana yang tertahan di antrean
  const request = await WithdrawalRequest.findById(withdrawalId);
  if (!request) {
    throw new AppError('Permintaan penarikan dana tidak ditemukan.', StatusCodes.NOT_FOUND);
  }

  // Pastikan Admin tidak memproses ulang transaksi yang sudah final
  if (request.status !== 'pending_approval') {
    throw new AppError('Transaksi ini sudah diproses sebelumnya dan bersifat final.', StatusCodes.BAD_REQUEST);
  }

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
      // AKSES DISETUJUI: Kunci status sukses dan suntik ke Buku Besar mutasi final
      request.status = 'success';
      request.admin_id = adminId;
      await request.save(options);

      await Transaction.create([{
        reference_id: request._id,
        reference_model: 'WithdrawalRequest',
        sender_id: request.user_id,
        receiver_id: null,
        amount: request.amount,
        type: 'withdrawal',
        is_flagged: false
      }], options);
      
      console.log(`✅ [ADMIN APPROVED] Dana Rp ${request.amount} resmi keluar permanen dari ekosistem.`);

    } else if (decision === 'reject') {
      // AKSES DITOLAK: Kembalikan saldo pengguna secara utuh (Conditional Refund)
      request.status = 'rejected';
      request.admin_id = adminId;
      request.rejected_reason = rejectedReason || 'Ditolak oleh kebijakan kepatuhan keamanan Admin.';
      await request.save(options);

      const wallet = await Wallet.findOne({ user_id: request.user_id }).session(session);
      if (!wallet) throw new Error('Dompet Wallet pengguna tidak ditemukan saat proses refund.');

      wallet.balance += request.amount; // Uang kembali ke dompet asal
      await wallet.save(options);
      
      console.log(`❌ [ADMIN REJECTED] Transaksi digagalkan. Dana Rp ${request.amount} dipulangkan ke User.`);
    }

    await session?.commitTransaction();
    session?.endSession();
    return request;

  } catch (error) {
    console.error('💥 [ADMIN DECISION CRASH] Gagal mengeksekusi keputusan operasional:', error.message);
    await session?.abortTransaction();
    session?.endSession();
    throw error;
  }
};

// ========================================================
// 7. SERVICE LAYER: PEER-TO-PEER INTERNAL TRANSFER
// ========================================================
exports.transferP2P = async (senderId, transferData) => {
  const { receiver_phone_number, amount, pin } = transferData;

  console.log(`💸 [P2P TRANSFER] Inisiasi transfer dari User ID: ${senderId} ke HP: ${receiver_phone_number} sebesar Rp ${amount}`);

  // Benteng 1: Validasi Input Dasar
  if (!receiver_phone_number || !amount || !pin) {
    throw new AppError('Nomor HP tujuan, nominal transfer, dan PIN wajib diisi.', StatusCodes.BAD_REQUEST);
  }

  if (amount < 10000) {
    throw new AppError('Minimal transfer antar pengguna adalah Rp 10.000.', StatusCodes.BAD_REQUEST);
  }

  // Benteng 2: Otentikasi PIN Lapis Baja
  // Karena field PIN disetel select: false di schema, kita wajib memanggilnya secara eksplisit
  const sender = await User.findById(senderId).select('+pin');
  if (!sender || !sender.pin) {
    throw new AppError('Autentikasi pengirim gagal atau PIN belum diatur.', StatusCodes.UNAUTHORIZED);
  }

  const isPinValid = await sender.correctPin(pin, sender.pin);
  if (!isPinValid) {
    throw new AppError('PIN yang Anda masukkan salah. Akses mutasi ditolak.', StatusCodes.BAD_REQUEST);
  }

  // Benteng 3: Cari Identitas Penerima Berdasarkan Nomor HP
  const receiver = await User.findOne({ phone_number: receiver_phone_number });
  if (!receiver) {
    throw new AppError('Nomor HP tujuan tidak terdaftar di sistem GreenPay.', StatusCodes.NOT_FOUND);
  }

  // Benteng 4: Cegah Transfer ke Diri Sendiri (Self-Loop Fraud)
  if (senderId.toString() === receiver._id.toString()) {
    throw new AppError('Anda tidak dapat mengirimkan uang ke nomor HP Anda sendiri.', StatusCodes.BAD_REQUEST);
  }

  // Tarik kedua dompet untuk eksekusi mutasi paralel
  const senderWallet = await Wallet.findOne({ user_id: senderId });
  const receiverWallet = await Wallet.findOne({ user_id: receiver._id });

  if (!senderWallet || !receiverWallet) {
    throw new AppError('Komponen dompet digital salah satu pihak tidak ditemukan.', StatusCodes.NOT_FOUND);
  }

  // Benteng 5: Cek Kecukupan Saldo Pengirim
  if (senderWallet.balance < amount) {
    throw new AppError('Saldo dompet Anda tidak mencukupi untuk melakukan transfer ini.', StatusCodes.BAD_REQUEST);
  }

  // Deteksi Otomatis Topologi Database (Anti-Crash lokal standalone)
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
    
    // Uang dikelompokkan sebagai High-Value jika menyentuh limit nominal >= 10jt
    const isHighValue = amount >= 10000000;
    
    // 1. Potong Saldo Pengirim SECARA ABSOLUT (Hold Mechanism anti double-spending)
    senderWallet.balance -= parseFloat(amount);
    await senderWallet.save(options);
    console.log(`   -> Saldo pengirim berhasil diamankan. Sisa: Rp ${senderWallet.balance}`);

    const txId = new mongoose.Types.ObjectId();

    if (!isHighValue) {
      // KONDISI A: Nominal Kecil (< 10 Juta) -> Saldo penerima langsung bertambah instan
      receiverWallet.balance += parseFloat(amount);
      await receiverWallet.save(options);

      await Transaction.create([{
        _id: txId,
        reference_id: txId,
        reference_model: 'Transaction',
        sender_id: senderId,
        receiver_id: receiver._id,
        amount: parseFloat(amount),
        type: 'transfer',
        status: 'success'
      }], options);
      
      console.log('✅ [P2P] Transfer bernilai kecil sukses diproses otomatis secara instan.');
    } else {
      // KONDISI B: Nominal Besar (>= 10 Juta) -> Saldo ditahan di Buku Besar dengan status tertangguhkan
      await Transaction.create([{
        _id: txId,
        reference_id: txId,
        reference_model: 'Transaction',
        sender_id: senderId,
        receiver_id: receiver._id,
        amount: parseFloat(amount),
        type: 'transfer',
        status: 'pending_approval' // Menggantung, menunggu restu tombol Admin
      }], options);
      
      console.log('⏳ [P2P] Operasi transfer skala besar terdeteksi. Dana dibekukan menanti verifikasi kliring Admin.');
    }

    await SavedContact.findOneAndUpdate(
      { user_id: senderId, contact_user_id: receiver._id },
      { user_id: senderId, contact_user_id: receiver._id },
      { upsert: true, returnDocument: 'after', ...(session ? { session } : {}) }
    );
    console.log(`🎴 [SAVED CONTACT] User ${receiver.username} otomatis disimpan ke daftar kontak User ${senderId}`);

    await session?.commitTransaction();
    session?.endSession();

    return {
      transaction_id: txId,
      amount,
      status: isHighValue ? 'pending_approval' : 'success',
      is_high_value: isHighValue,
      remaining_balance: senderWallet.balance
    };

  } catch (error) {
    console.error('💥 [P2P TRANSFER CRASH] Menggagalkan sirkuit transfer internal:', error.message);
    await session?.abortTransaction();
    session?.endSession();
    throw error;
  }
};

// ========================================================
// 8. SERVICE LAYER: HISTORY & LEDGER AGGREGATOR
// ========================================================
exports.getTransactionHistory = async (userId, queryFilters) => {
  const { type, page = 1, limit = 10 } = queryFilters;

  console.log(`📊 [LEDGER AGGREGATOR] Membuka lembaran buku besar untuk User ID: ${userId}`);

  // 1. Kunci Query Filter Utama: Pengguna bisa bertindak sebagai Pengirim ATAU Penerima dana
  let query = {
    $or: [
      { sender_id: userId },
      { receiver_id: userId }
    ]
  };

  // 2. Filter Dinamis: Jika pengguna ingin menyaring riwayat berdasarkan tipe (topup / transfer / withdrawal)
  if (type) {
    query.type = type;
  }

  // 3. Kalkulasi Pagination: Mengamankan kinerja RAM 8GB laptop agar tidak membaca ribuan data sekaligus
  const parsedPage = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
  const parsedLimit = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 10;
  const skip = (parsedPage - 1) * parsedLimit;

  try {
    // 4. Tarik data dari Buku Besar Utama secara paralel
    const transactions = await Transaction.find(query)
      .populate('sender_id', 'username email phone_number')
      .populate('receiver_id', 'username email phone_number')
      .sort({ createdAt: -1 }) // Selalu utamakan mutasi paling baru di urutan teratas
      .skip(skip)
      .limit(parsedLimit);

    // Hitung total rekam jejak untuk keperluan informasi meta pagination di frontend
    const totalRecords = await Transaction.countDocuments(query);

    // 5. TRANSFORMASI DATA DINAMIS (MAPPING FOR MOBILE FLATLIST)
    // React Native membutuhkan kepastian mutasi: Uang Masuk (+) atau Uang Keluar (-) secara visual
    const records = transactions.map((tx) => {
      // Deteksi arah arus keuangan secara real-time terhadap user yang sedang me-request
      const isSender = tx.sender_id && tx.sender_id._id.toString() === userId.toString();
      const flow = isSender ? 'out' : 'in';

      return {
        _id: tx._id,
        reference_id: tx.reference_id,
        reference_model: tx.reference_model,
        type: tx.type, // topup, transfer, atau withdrawal
        amount: tx.amount,
        flow, // Menghasilkan string 'in' atau 'out' untuk pewarnaan Hijau/Merah di HP
        // Counterparty: Menampilkan identitas lawan transaksi (siapa pengirimnya atau siapa penerimanya)
        counterparty: flow === 'out' 
          ? (tx.receiver_id ? tx.receiver_id.username : tx.reference_model) 
          : (tx.sender_id ? tx.sender_id.username : 'External System'),
        createdAt: tx.createdAt
      };
    });

    return {
      metadata: {
        total_records: totalRecords,
        current_page: parsedPage,
        limit: parsedLimit,
        total_pages: Math.ceil(totalRecords / parsedLimit)
      },
      records
    };

  } catch (error) {
    console.error('💥 [LEDGER AGGREGATOR CRASH] Gagal mengagregasi data buku besar:', error.message);
    throw error;
  }
};