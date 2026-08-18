// tests/user.test.js
const request = require('supertest');
const app = require('../app');
const { createTestUser } = require('./helpers/testFactory');

describe('🧪 [USER ENGINE INTEGRATION TEST]', () => {
  
  it('1. Harus sukses mengambil profil pengguna & saldo dompet bawaan yang sah (200)', async () => {
    // 💡 Setup instan 1 baris via Test Factory!
    const { accessToken, user } = await createTestUser({ balance: 5000000 });

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.profile.email).toBe(user.email);
    expect(res.body.data.wallet.balance).toBe(5000000);
  });

  it('2. Harus menolak akses dasbor jika request tidak membawa Bearer Token (401)', async () => {
    const res = await request(app).get('/api/v1/users/me');

    expect(res.statusCode).toEqual(401);
    expect(res.body.status).toBe('fail');
    expect(res.body.error_code).toBe('INVALID_TOKEN');
  });

  it('3. Harus memblokir pengisian PIN jika pengguna sudah memiliki PIN transaksi aktif (400)', async () => {
    const { accessToken } = await createTestUser({ pin: '123456' }); // User sudah ber-PIN

    const res = await request(app)
      .post('/api/v1/users/setup-pin')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ pin: '654321' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toBe('fail');
  });
});