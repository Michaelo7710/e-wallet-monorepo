const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin ID wajib dicantumkan dalam catatan audit'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Tipe tindakan administratif wajib ditentukan'],
      enum: [
        'TOPUP_APPROVAL',
        'TOPUP_CANCEL',
        'TOPUP_DELETE',
        'WITHDRAWAL_APPROVAL',
        'WITHDRAWAL_REJECT',
        'TRANSFER_APPROVAL',
        'TRANSFER_REJECT',
        'USER_FREEZE',
        'USER_UNFREEZE',
        'BANK_CREATE',
        'BANK_UPDATE',
        'BANK_DELETE',
      ],
      index: true,
    },
    target_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'ID target entitas wajib dicantumkan'],
      index: true,
    },
    target_type: {
      type: String,
      required: [true, 'Tipe target entitas wajib ditentukan'],
      enum: ['TopUpRequest', 'WithdrawalRequest', 'Transaction', 'User', 'AdminBank'],
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip_address: {
      type: String,
      default: null,
    },
    user_agent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Catatan audit bersifat append-only / immutable
  }
);

// ========================================================
// B-TREE COMPOUND INDEXES UNTUK AUDIT & COMPLIANCE QUERY
// ========================================================
adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ admin_id: 1, createdAt: -1 });
adminAuditLogSchema.index({ target_id: 1, target_type: 1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });

// ========================================================
// IMMUTABILITY GUARD: Cegah modifikasi catatan audit
// ========================================================
adminAuditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'findByIdAndUpdate'], function () {
  throw new Error('Catatan audit administratif bersifat permanen (immutable) dan tidak dapat diubah.');
});

adminAuditLogSchema.pre('save', function () {
  if (!this.isNew) {
    throw new Error('Catatan audit administratif bersifat permanen (immutable) dan tidak dapat diubah.');
  }
});

const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);

module.exports = AdminAuditLog;
