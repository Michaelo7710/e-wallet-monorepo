// const mongoose = require('mongoose');

// const verificationCodeSchema = new mongoose.Schema({
//   user_id: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   code: {
//     type: String,
//     required: true
//   },
//   type: {
//     type: String,
//     enum: ['forgot_password', 'change_email', 'change_pin', 'two_factor'],
//     required: true
//   },
//   expires_at: {
//     type: Date,
//     required: true
//   },
//   is_used: {
//     type: Boolean,
//     default: false
//   }
// }, {
//   timestamps: true
// });

// module.exports = mongoose.model('VerificationCode', verificationCodeSchema);

const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID wajib terikat dengan kode verifikasi']
  },
  code: {
    type: String,
    required: [true, 'Kode OTP wajib diisi']
  },
  type: {
    type: String,
    enum: ['email_verification', 'forgot_password', 'change_email', 'change_pin', 'two_factor'],
    required: [true, 'Tipe OTP harus didefinisikan secara spesifik']
  },
  expires_at: {
    type: Date,
    required: [true, 'Waktu kedaluwarsa wajib ditentukan']
  },
  is_used: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Pemanfaatan TTL Index MongoDB: Data otomatis terhapus dari DB jika sudah expired demi efisiensi storage
verificationCodeSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);