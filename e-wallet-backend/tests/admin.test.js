const request = require('supertest');
const app = require('../app');
const { createTestUser, createTestAdmin } = require('./helpers/testFactory');

describe('🧪 [ADMIN ENGINE & RBAC INTEGRATION TEST]', () => {
  it('1. Harus memblokir pengguna biasa (role: user) saat mengakses rute admin (403 Forbidden)', async () => {
    const { accessToken } = await createTestUser(); // User biasa

    const res = await request(app)
      .get('/api/v1/admin/banks')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.status).toBe('fail');
  });

  it('2. Harus sukses mendaftarkan rekening master platform baru jika login sebagai Admin (201)', async () => {
    const { token: adminToken } = await createTestAdmin(); // Admin Role

    const res = await request(app)
      .post('/api/v1/admin/banks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bank_name: 'MANDIRI',
        account_number: '1230009988776',
        account_name: 'PT GreenPay Official',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.bank_name).toBe('MANDIRI');
  });

  it('3. Harus sukses menarik ringkasan laporan neraca keuangan (200)', async () => {
    const { token: adminToken } = await createTestAdmin();

    const res = await request(app)
      .get('/api/v1/admin/financial-report?filter=monthly&month=8')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');
    expect(res.body).toHaveProperty('data');
  });

  it('4. Harus mengembalikan struktur pagination kursor pada antrean pending topup, withdrawal, dan transfer (200)', async () => {
    const { token: adminToken } = await createTestAdmin();

    // Test Topup Queue
    const topupRes = await request(app)
      .get('/api/v1/admin/topups/pending?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(topupRes.statusCode).toEqual(200);
    expect(topupRes.body.status).toBe('success');
    expect(topupRes.body).toHaveProperty('data');
    expect(topupRes.body).toHaveProperty('meta');
    expect(topupRes.body.meta).toEqual(
      expect.objectContaining({
        limit: 5,
        has_more: expect.any(Boolean),
      })
    );

    // Test Withdrawal Queue
    const withdrawalRes = await request(app)
      .get('/api/v1/admin/withdrawals/pending?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(withdrawalRes.statusCode).toEqual(200);
    expect(withdrawalRes.body.status).toBe('success');
    expect(withdrawalRes.body.meta).toEqual(
      expect.objectContaining({
        limit: 5,
        has_more: expect.any(Boolean),
      })
    );

    // Test Transfer Queue
    const transferRes = await request(app)
      .get('/api/v1/admin/transfers/pending?limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(transferRes.statusCode).toEqual(200);
    expect(transferRes.body.status).toBe('success');
    expect(transferRes.body.meta).toEqual(
      expect.objectContaining({
        limit: 5,
        has_more: expect.any(Boolean),
      })
    );
  });

  it('5. Harus melakukan traversal paginasi kursor multi-halaman secara akurat (FIFO)', async () => {
    const { token: adminToken } = await createTestAdmin();
    const { user } = await createTestUser();
    const { TopUpRequest } = require('../src/models');

    // Buat 3 antrean topup terurut
    const now = Date.now();
    await TopUpRequest.create([
      {
        user_id: user._id,
        reference_number: `REF-CURSOR-1-${now}`,
        payment_method: 'manual',
        amount: 25000,
        status: 'pending',
      },
      {
        user_id: user._id,
        reference_number: `REF-CURSOR-2-${now}`,
        payment_method: 'manual',
        amount: 50000,
        status: 'pending',
      },
      {
        user_id: user._id,
        reference_number: `REF-CURSOR-3-${now}`,
        payment_method: 'manual',
        amount: 75000,
        status: 'pending',
      },
    ]);

    // Request Halaman 1 (limit: 2)
    const page1 = await request(app)
      .get('/api/v1/admin/topups/pending?limit=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(page1.statusCode).toBe(200);
    expect(page1.body.data.length).toBe(2);
    expect(page1.body.meta.has_more).toBe(true);
    expect(page1.body.meta.next_cursor).toBeTruthy();

    const cursor = page1.body.meta.next_cursor;
    const page1Ids = page1.body.data.map((item) => item._id);

    // Request Halaman 2 dengan cursor dari Halaman 1
    const page2 = await request(app)
      .get(`/api/v1/admin/topups/pending?cursor=${cursor}&limit=2`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(page2.statusCode).toBe(200);
    expect(page2.body.data.length).toBeGreaterThanOrEqual(1);

    const page2Ids = page2.body.data.map((item) => item._id);

    // Pastikan tidak ada data yang tumpang tindih (Zero duplicate item)
    for (const id of page2Ids) {
      expect(page1Ids).not.toContain(id);
    }
  });

  it('6. Harus menolak akses GET /api/v1/admin/stats tanpa auth (401) atau non-admin (403)', async () => {
    // 1. Tanpa token autentikasi
    const unauthRes = await request(app).get('/api/v1/admin/stats');
    expect(unauthRes.statusCode).toBe(401);
    expect(unauthRes.body.status).toBe('fail');

    // 2. Dengan token pengguna biasa
    const { accessToken } = await createTestUser();
    const userRes = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(userRes.statusCode).toBe(403);
    expect(userRes.body.status).toBe('fail');
  });

  it('7. Harus sukses menarik data metrik eksekutif GET /api/v1/admin/stats jika login Admin (200)', async () => {
    const { token: adminToken } = await createTestAdmin();

    const res = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body).toHaveProperty('data');

    const { data } = res.body;
    expect(typeof data.total_users).toBe('number');
    expect(typeof data.total_volume).toBe('number');
    expect(typeof data.pending_withdrawals_count).toBe('number');
    expect(typeof data.pending_topups_count).toBe('number');
    expect(typeof data.pending_transfers_count).toBe('number');

    expect(data.total_users).toBeGreaterThanOrEqual(0);
    expect(data.total_volume).toBeGreaterThanOrEqual(0);
    expect(data.pending_withdrawals_count).toBeGreaterThanOrEqual(0);
    expect(data.pending_topups_count).toBeGreaterThanOrEqual(0);
    expect(data.pending_transfers_count).toBeGreaterThanOrEqual(0);
  });

  it('8. Harus menghitung seluruh 5 metrik agregasi /admin/stats secara presisi', async () => {
    const mongoose = require('mongoose');
    const { TopUpRequest, WithdrawalRequest, Transaction } = require('../src/models');
    const { token: adminToken } = await createTestAdmin();

    // 1. Ambil baseline metrik awal
    const baseRes = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(baseRes.statusCode).toBe(200);
    const base = baseRes.body.data;

    // 2. Seeding entitas terisolasi
    const { user: sender } = await createTestUser();
    const { user: receiver } = await createTestUser();
    const now = Date.now();

    // Pending TopUp (+1)
    await TopUpRequest.create({
      user_id: sender._id,
      reference_number: `REF-TU-PRECISION-${now}`,
      payment_method: 'manual',
      amount: 75000,
      status: 'pending',
    });

    // Pending Withdrawal (+1)
    await WithdrawalRequest.create({
      user_id: sender._id,
      reference_number: `REF-WD-PRECISION-${now}`,
      bank_name: 'BCA',
      account_number: '9988776655',
      account_name: 'Sender Test',
      amount: 10000000,
      status: 'pending_approval',
    });

    // Pending Transfer (+1)
    await Transaction.create({
      reference_id: new mongoose.Types.ObjectId(),
      reference_model: 'TransferP2P',
      amount: 500000,
      type: 'transfer',
      status: 'pending_approval',
      sender_id: sender._id,
      receiver_id: receiver._id,
    });

    // Successful Transfer (+150.000 volume)
    await Transaction.create({
      reference_id: new mongoose.Types.ObjectId(),
      reference_model: 'TransferP2P',
      amount: 150000,
      type: 'transfer',
      status: 'success',
      sender_id: sender._id,
      receiver_id: receiver._id,
    });

    // Successful Withdrawal (+200.000 volume)
    await Transaction.create({
      reference_id: new mongoose.Types.ObjectId(),
      reference_model: 'WithdrawalRequest',
      amount: 200000,
      type: 'withdrawal',
      status: 'success',
      sender_id: sender._id,
      receiver_id: null,
    });

    // 3. Verifikasi delta metrik pasca-seeding
    const updatedRes = await request(app)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(updatedRes.statusCode).toBe(200);
    const updated = updatedRes.body.data;

    expect(updated.total_users).toBe(base.total_users + 2); // 2 users baru (sender & receiver)
    expect(updated.pending_topups_count).toBe(base.pending_topups_count + 1);
    expect(updated.pending_withdrawals_count).toBe(base.pending_withdrawals_count + 1);
    expect(updated.pending_transfers_count).toBe(base.pending_transfers_count + 1);
    expect(updated.total_volume).toBe(base.total_volume + 350000); // 150.000 + 200.000
  });
});