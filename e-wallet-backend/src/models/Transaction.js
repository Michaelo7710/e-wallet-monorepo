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
//   timestamps: { createdAt: 'created_at', updatedAt: false } // History biasanya tidak di-update
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
  // Riwayat keuangan bersifat immutable (tidak boleh di-update), cukup timestamps createdAt
  timestamps: { createdAt: 'created_at', updatedAt: false } 
});

module.exports = mongoose.model('Transaction', transactionSchema);