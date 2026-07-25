const mongoose = require('mongoose');

const savedContactSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contact_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Mencegah duplikasi kontak yang sama untuk user yang sama
savedContactSchema.index({ user_id: 1, contact_user_id: 1 }, { unique: true });

module.exports = mongoose.model('SavedContact', savedContactSchema);