const mongoose = require('mongoose');

const adminBankSchema = new mongoose.Schema({
  bank_name: {
    type: String,
    required: [true, 'Nama Bank wajib diisi']
  },
  account_name: {
    type: String,
    required: [true, 'Nama Pemilik Rekening wajib diisi']
  },
  account_number: {
    type: String,
    required: [true, 'Nomor Rekening wajib diisi']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminBank', adminBankSchema);