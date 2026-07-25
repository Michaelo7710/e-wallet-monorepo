const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Pemilik refresh token wajib dicantumkan.']
  },
  token: {
    type: String,
    required: [true, 'String token wajib diisi.'],
    index: true
  },
  expires_at: {
    type: Date,
    required: [true, 'Waktu kedaluwarsa token wajib ditentukan.']
  }
}, { timestamps: true });

// CAPTAIN TTL: Otomatis hapus dokumen sampah jika masa aktif 7 hari sudah lewat
refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);