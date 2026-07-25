const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID pemilik dana wajib dicantumkan']
  },
  reference_number: {
    type: String,
    required: [true, 'Nomor referensi internal mutlak diperlukan'],
    unique: true,
    index: true
  },
  bank_name: {
    type: String,
    required: [true, 'Nama Bank tujuan transfer wajib diisi']
  },
  account_number: {
    type: String,
    required: [true, 'Nomor rekening bank tujuan tidak boleh kosong']
  },
  account_name: {
    type: String,
    required: [true, 'Nama pemilik rekening bank tujuan wajib dicantumkan']
  },
  amount: {
    type: Number,
    required: [true, 'Nominal penarikan uang wajib ditentukan'],
    min: [50000, 'Minimal penarikan saldo keluar sistem adalah Rp 50.000']
  },
  is_high_value: {
    type: Boolean,
    default: false // Otomatis TRUE via hook jika menyentuh limit 2 digit juta
  },
  status: {
    type: String,
    enum: ['pending_approval', 'processing', 'success', 'rejected'],
    default: 'processing' // Jika di bawah limit, langsung masuk status siap eksekusi
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Mengidentifikasi Admin mana yang melakukan Approve/Reject
  },
  rejected_reason: {
    type: String,
    default: null // Alasan jika Admin membatalkan penarikan
  }
}, {
  timestamps: true
});

// ========================================================
// SATPAM LIMIT: Filter Otomatis Berdasarkan Nominal Finansial
// ========================================================
withdrawalRequestSchema.pre('save', async function(next) {
  // Integrasi Aturan Bisnis: Jika nominal >= Rp 10.000.000 (2 Digit Juta)
  if (this.amount >= 10000000) {
    this.is_high_value = true;
    this.status = 'pending_approval'; // Tahan sirkulasi dana, paksa antre di CRUD Admin
  }
});

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);