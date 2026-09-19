const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const {
  User,
  Wallet,
  AdminBank,
  TopUpRequest,
  WithdrawalRequest,
  Transaction,
  AdminAuditLog,
} = require('../src/models');
const { createTestUser, createTestAdmin } = require('./helpers/testFactory');

describe('🧪 [TASK-ADM-05: FINTECH ADMINISTRATIVE AUDIT TRAIL SYSTEM & COMPLIANCE]', () => {
  let adminToken;
  let adminUser;

  beforeEach(async () => {
    const adminRes = await createTestAdmin();
    adminToken = adminRes.token;
    adminUser = adminRes.admin;
  });

  // ========================================================
  // PART 1: IMMUTABILITY & TAMPER-RESISTANCE GUARD
  // ========================================================
  describe('Part 1: Immutability Guard (Append-Only Enforcement)', () => {
    it('1. Harus menolak manipulasi dokumen log audit melalui findOneAndUpdate / updateOne (Error 500/Exception)', async () => {
      const auditLog = await AdminAuditLog.create({
        admin_id: adminUser._id,
        action: 'USER_FREEZE',
        target_id: adminUser._id,
        target_type: 'User',
        details: { note: 'Initial state' },
      });

      // Percobaan pemalsuan / modifikasi data audit
      await expect(
        AdminAuditLog.findOneAndUpdate(
          { _id: auditLog._id },
          { action: 'USER_UNFREEZE', 'details.note': 'Tampered state' }
        )
      ).rejects.toThrow('Catatan audit administratif bersifat permanen (immutable) dan tidak dapat diubah.');

      await expect(
        AdminAuditLog.updateOne(
          { _id: auditLog._id },
          { action: 'TOPUP_APPROVAL' }
        )
      ).rejects.toThrow('Catatan audit administratif bersifat permanen (immutable) dan tidak dapat diubah.');
    });
  });

  // ========================================================
  // PART 2: AUTOMATED AUDIT LOGGING ON ADMIN MUTATIONS
  // ========================================================
  describe('Part 2: Automated Audit Logging across Admin Mutations', () => {
    it('2. Bank Management: mencatat log audit pada CREATE, UPDATE, dan DELETE bank', async () => {
      // 2a. Create Bank
      const createRes = await request(app)
        .post('/api/v1/admin/banks')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('User-Agent', 'FinTech-Admin-Portal/1.0')
        .send({
          bank_name: 'Bank Mandiri',
          account_number: '1234567890123',
          account_holder_name: 'PT GreenPay Finance',
        });

      expect(createRes.statusCode).toBe(201);
      const bankId = createRes.body.data._id;

      const createAudit = await AdminAuditLog.findOne({
        action: 'BANK_CREATE',
        target_id: bankId,
      });
      expect(createAudit).toBeDefined();
      expect(createAudit.admin_id.toString()).toBe(adminUser._id.toString());
      expect(createAudit.target_type).toBe('AdminBank');
      expect(createAudit.details.bank_name).toBe('Bank Mandiri');

      // 2b. Update Bank
      const updateRes = await request(app)
        .put(`/api/v1/admin/banks/${bankId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ bank_name: 'Bank Mandiri Updated' });

      expect(updateRes.statusCode).toBe(200);

      const updateAudit = await AdminAuditLog.findOne({
        action: 'BANK_UPDATE',
        target_id: bankId,
      });
      expect(updateAudit).toBeDefined();
      expect(updateAudit.details.updated_fields).toContain('bank_name');

      // 2c. Delete Bank
      const deleteRes = await request(app)
        .delete(`/api/v1/admin/banks/${bankId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.statusCode).toBe(200);

      const deleteAudit = await AdminAuditLog.findOne({
        action: 'BANK_DELETE',
        target_id: bankId,
      });
      expect(deleteAudit).toBeDefined();
    });

    it('3. TopUp Management: mencatat log audit pada APPROVE, CANCEL, dan DELETE top up', async () => {
      const { user } = await createTestUser();
      const adminBank = await AdminBank.create({
        bank_name: 'BCA',
        account_number: '9876543210',
        account_name: 'PT GreenPay',
      });

      // 3a. TopUp Approve
      const topUpApprove = await TopUpRequest.create({
        user_id: user._id,
        admin_bank_id: adminBank._id,
        amount: 250000,
        payment_method: 'manual',
        reference_number: `REF-TOPUP-${Date.now()}-A`,
        status: 'pending',
      });

      const approveRes = await request(app)
        .patch(`/api/v1/admin/topups/${topUpApprove._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approveRes.statusCode).toBe(200);

      const approveAudit = await AdminAuditLog.findOne({
        action: 'TOPUP_APPROVAL',
        target_id: topUpApprove._id,
      });
      expect(approveAudit).toBeDefined();
      expect(approveAudit.details.amount).toBe(250000);

      // 3b. TopUp Cancel
      const topUpCancel = await TopUpRequest.create({
        user_id: user._id,
        admin_bank_id: adminBank._id,
        amount: 100000,
        payment_method: 'manual',
        reference_number: `REF-TOPUP-${Date.now()}-B`,
        status: 'pending',
      });

      const cancelRes = await request(app)
        .patch(`/api/v1/admin/topups/${topUpCancel._id}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(cancelRes.statusCode).toBe(200);

      const cancelAudit = await AdminAuditLog.findOne({
        action: 'TOPUP_CANCEL',
        target_id: topUpCancel._id,
      });
      expect(cancelAudit).toBeDefined();

      // 3c. TopUp Soft Delete (Hanya boleh jika status bukan pending)
      const deleteRes = await request(app)
        .delete(`/api/v1/admin/topups/${topUpCancel._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.statusCode).toBe(200);

      const deleteAudit = await AdminAuditLog.findOne({
        action: 'TOPUP_DELETE',
        target_id: topUpCancel._id,
      });
      expect(deleteAudit).toBeDefined();
    });

    it('4. Withdrawal Management: mencatat log audit pada APPROVE dan REJECT penarikan', async () => {
      const { user } = await createTestUser({ balance: 2000000 });

      // 4a. Withdrawal Approve
      const withdrawalApprove = await WithdrawalRequest.create({
        user_id: user._id,
        amount: 300000,
        bank_name: 'BNI',
        account_number: '1122334455',
        account_name: 'Nasabah BNI',
        reference_number: `REF-WD-${Date.now()}-A`,
        status: 'pending_approval',
      });

      const approveRes = await request(app)
        .patch(`/api/v1/admin/withdrawals/${withdrawalApprove._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approveRes.statusCode).toBe(200);

      const approveAudit = await AdminAuditLog.findOne({
        action: 'WITHDRAWAL_APPROVAL',
        target_id: withdrawalApprove._id,
      });
      expect(approveAudit).toBeDefined();
      expect(approveAudit.details.amount).toBe(300000);

      // 4b. Withdrawal Reject
      const withdrawalReject = await WithdrawalRequest.create({
        user_id: user._id,
        amount: 200000,
        bank_name: 'BRI',
        account_number: '9988776655',
        account_name: 'Nasabah BRI',
        reference_number: `REF-WD-${Date.now()}-B`,
        status: 'pending_approval',
      });

      const rejectRes = await request(app)
        .patch(`/api/v1/admin/withdrawals/${withdrawalReject._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejected_reason: 'Nama pemilik rekening tidak cocok dengan identitas KTP' });

      expect(rejectRes.statusCode).toBe(200);

      const rejectAudit = await AdminAuditLog.findOne({
        action: 'WITHDRAWAL_REJECT',
        target_id: withdrawalReject._id,
      });
      expect(rejectAudit).toBeDefined();
      expect(rejectAudit.details.rejected_reason).toContain('Nama pemilik rekening tidak cocok');
    });

    it('5. Transfer Management: mencatat log audit pada APPROVE dan REJECT transfer AML besar', async () => {
      const { user: sender } = await createTestUser({ balance: 20000000 });
      const { user: receiver } = await createTestUser({ balance: 500000 });

      // 5a. Transfer Approve
      const txApprove = await Transaction.create({
        sender_id: sender._id,
        receiver_id: receiver._id,
        amount: 15000000,
        type: 'transfer',
        status: 'pending_approval',
        reference_number: `GP-TRF-${Date.now()}-1`,
        reference_id: new mongoose.Types.ObjectId(),
        reference_model: 'Transaction',
      });

      const approveRes = await request(app)
        .patch(`/api/v1/admin/transfers/${txApprove._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(approveRes.statusCode).toBe(200);

      const approveAudit = await AdminAuditLog.findOne({
        action: 'TRANSFER_APPROVAL',
        target_id: txApprove._id,
      });
      expect(approveAudit).toBeDefined();
      expect(approveAudit.details.amount).toBe(15000000);

      // 5b. Transfer Reject
      const txReject = await Transaction.create({
        sender_id: sender._id,
        receiver_id: receiver._id,
        amount: 12000000,
        type: 'transfer',
        status: 'pending_approval',
        reference_number: `GP-TRF-${Date.now()}-2`,
        reference_id: new mongoose.Types.ObjectId(),
        reference_model: 'Transaction',
      });

      const rejectRes = await request(app)
        .patch(`/api/v1/admin/transfers/${txReject._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rejected_reason: 'Indikasi pencucian uang AML alert' });

      expect(rejectRes.statusCode).toBe(200);

      const rejectAudit = await AdminAuditLog.findOne({
        action: 'TRANSFER_REJECT',
        target_id: txReject._id,
      });
      expect(rejectAudit).toBeDefined();
      expect(rejectAudit.details.rejected_reason).toBe('Indikasi pencucian uang AML alert');
    });

    it('6. User Governance: mencatat log audit pada FREEZE dan UNFREEZE user', async () => {
      const { user: targetUser } = await createTestUser();

      // 6a. Freeze User
      const freezeRes = await request(app)
        .patch(`/api/v1/admin/users/${targetUser._id}/freeze`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Aktivitas mencurigakan akun baru' });

      expect(freezeRes.statusCode).toBe(200);

      const freezeAudit = await AdminAuditLog.findOne({
        action: 'USER_FREEZE',
        target_id: targetUser._id,
      });
      expect(freezeAudit).toBeDefined();
      expect(freezeAudit.details.email).toBe(targetUser.email);
      expect(freezeAudit.details.reason).toBe('Aktivitas mencurigakan akun baru');

      // 6b. Unfreeze User
      const unfreezeRes = await request(app)
        .patch(`/api/v1/admin/users/${targetUser._id}/unfreeze`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(unfreezeRes.statusCode).toBe(200);

      const unfreezeAudit = await AdminAuditLog.findOne({
        action: 'USER_UNFREEZE',
        target_id: targetUser._id,
      });
      expect(unfreezeAudit).toBeDefined();
      expect(unfreezeAudit.details.email).toBe(targetUser.email);
    });
  });

  // ========================================================
  // PART 3: AUDIT LOG QUERY ENDPOINT & FILTERING
  // ========================================================
  describe('Part 3: Query Endpoint GET /api/v1/admin/audit-logs', () => {
    beforeEach(async () => {
      // Siapkan variasi log untuk pengujian query & filter
      await AdminAuditLog.create([
        {
          admin_id: adminUser._id,
          action: 'BANK_CREATE',
          target_id: new mongoose.Types.ObjectId(),
          target_type: 'AdminBank',
          details: { bank: 'Test Bank A' },
        },
        {
          admin_id: adminUser._id,
          action: 'USER_FREEZE',
          target_id: new mongoose.Types.ObjectId(),
          target_type: 'User',
          details: { reason: 'Fraud' },
        },
        {
          admin_id: adminUser._id,
          action: 'TOPUP_APPROVAL',
          target_id: new mongoose.Types.ObjectId(),
          target_type: 'TopUpRequest',
          details: { amount: 500000 },
        },
      ]);
    });

    it('7. Harus mengembalikan daftar log audit dengan pagination metadata dan populate admin (200 OK)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('next_cursor');
      expect(res.body.meta.limit).toBe(2);

      // Verifikasi struktur data & populate
      const log = res.body.data[0];
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('target_type');
      expect(log).toHaveProperty('admin_id');
      expect(log.admin_id).toHaveProperty('username');
      expect(log.admin_id).toHaveProperty('email');
    });

    it('8. Harus memfilter berdasarkan tipe action (misal: USER_FREEZE)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?action=USER_FREEZE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      res.body.data.forEach((item) => {
        expect(item.action).toBe('USER_FREEZE');
      });
    });

    it('9. Harus memfilter berdasarkan target_type (misal: AdminBank)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?target_type=AdminBank')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      res.body.data.forEach((item) => {
        expect(item.target_type).toBe('AdminBank');
      });
    });

    it('10. Harus memfilter berdasarkan admin_id yang mengeksekusi', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/audit-logs?admin_id=${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      res.body.data.forEach((item) => {
        expect(item.admin_id._id.toString()).toBe(adminUser._id.toString());
      });
    });

    it('11. Keyset cursor pagination harus mengembalikan halaman lanjutan dengan tepat', async () => {
      const page1Res = await request(app)
        .get('/api/v1/admin/audit-logs?limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(page1Res.statusCode).toBe(200);
      expect(page1Res.body.data.length).toBe(1);
      const nextCursor = page1Res.body.meta.next_cursor;
      expect(nextCursor).toBeTruthy();

      const page2Res = await request(app)
        .get(`/api/v1/admin/audit-logs?limit=1&cursor=${nextCursor}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(page2Res.statusCode).toBe(200);
      expect(page2Res.body.data.length).toBe(1);
      expect(page2Res.body.data[0]._id).not.toBe(page1Res.body.data[0]._id);
    });
  });

  // ========================================================
  // PART 4: RBAC & SECURITY ACCESS GUARDS
  // ========================================================
  describe('Part 4: RBAC & Security Access Control', () => {
    it('12. Harus menolak akses GET /audit-logs dari pengguna biasa (403 Forbidden)', async () => {
      const { token: userToken } = await createTestUser();

      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.status).toBe('fail');
    });

    it('13. Harus menolak akses GET /audit-logs tanpa token otentikasi (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/v1/admin/audit-logs');

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('fail');
    });
  });
});
