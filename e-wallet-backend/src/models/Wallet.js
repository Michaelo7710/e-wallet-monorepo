const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Merujuk ke model User
    required: true,
    unique: true // Relasi One-to-One: 1 User hanya punya 1 Dompet
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Saldo tidak boleh minus'] // Validasi absolut di level database
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Wallet', walletSchema);