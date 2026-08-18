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
        account_holder_name: 'PT GreenPay Official',
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
});