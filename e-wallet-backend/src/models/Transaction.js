// const mongoose = require('mongoose');

// const transactionSchema = new mongoose.Schema({
//   sender_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     default: null 
//   },
//   receiver_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   amount: {
//     type: Number,
//     required: true
//   },
//   type: {
//     type: String,
//     enum: ['topup', 'transfer'],
//     required: true
//   },
//   is_flagged: {
//     type: Boolean,
//     default: false // Anti-Fraud Analytics untuk Admin
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('Transaction', transactionSchema);

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  reference_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'ID dokumen sumber transaksi wajib disertakan'],
    // Menghubungkan log secara dinamis bisa ke TopUpRequest atau WithdrawalRequest
    index: true 
  },
  reference_model: {
    type: String,
    required: [true, 'Nama model referensi wajib didefinisikan'],
    enum: ['TopUpRequest', 'WithdrawalRequest', 'TransferP2P', 'Transaction'] // Membatasi asal usul mutasi
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Bernilai NULL jika berupa transaksi Top Up masuk dari luar sistem
  },
  receiver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [
      function() { return this.type !== 'withdrawal'; }, 
      'Penerima manfaat transaksi wajib dicantumkan untuk mutasi internal'
    ],
    default: null
  },
  amount: {
    type: Number,
    required: [true, 'Nominal mutasi finansial wajib dicantumkan'],
    min: [1, 'Nominal transaksi tidak valid']
  },
  type: {
    type: String,
    enum: ['topup', 'transfer', 'withdrawal'],
    required: [true, 'Tipe transaksi wajib ditentukan secara spesifik']
  },
  is_flagged: {
    type: Boolean,
    default: false // Integritas Anti-Fraud Analytics untuk keamanan Admin Dashboard
  }
}, {
  timestamps: true
});

transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ sender_id: 1, createdAt: -1 });
transactionSchema.index({ receiver_id: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);