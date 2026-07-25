// const mongoose = require('mongoose');

// const topUpRequestSchema = new mongoose.Schema({
//   user_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   admin_bank_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'AdminBank',
//     required: true
//   },
//   amount: {
//     type: Number,
//     required: true,
//     min: [10000, 'Minimal top up adalah Rp 10.000']
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'success', 'cancel'],
//     default: 'pending'
//   },
//   deleted_at: {
//     type: Date,
//     default: null // Konsep Soft Delete
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('TopUpRequest', topUpRequestSchema);

const mongoose = require('mongoose');

const topUpRequestSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID wajib dicantumkan']
  },
  reference_number: {
    type: String,
    required: [true, 'Nomor referensi unik wajib diisi'],
    unique: true,
    index: true // Akselerasi pencarian kilat saat Webhook Midtrans mengetuk server
  },
  payment_method: {
    type: String,
    enum: ['manual', 'midtrans'],
    required: [true, 'Metode pembayaran (manual/midtrans) wajib ditentukan']
  },
  // Bersifat opsional, hanya terisi jika payment_method === 'manual'
  admin_bank_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminBank',
    default: null
  },
  amount: {
    type: Number,
    required: [true, 'Nominal top up wajib diisi'],
    min: [10000, 'Minimal top up adalah Rp 10.000']
  },
  status: {
    type: String,
    // Mengakomodasi status administrasi lokal & respon asinkronus Midtrans
    enum: ['pending', 'success', 'cancel', 'failed', 'expire'],
    default: 'pending'
  },
  // Koridor Khusus Otomatisasi Midtrans (Bernilai null jika metode manual)
  snap_token: {
    type: String,
    default: null
  },
  midtrans_transaction_id: {
    type: String,
    default: null,
    index: true
  },
  settled_at: {
    type: Date,
    default: null // Bukti forensik presisi kapan dana masuk
  },
  deleted_at: {
    type: Date,
    default: null // Konsep Soft Delete untuk pemenuhan syarat tugas dashboard admin
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TopUpRequest', topUpRequestSchema);