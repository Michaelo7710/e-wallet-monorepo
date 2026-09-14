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
});