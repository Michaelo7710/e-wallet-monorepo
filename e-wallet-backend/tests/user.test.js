// tests/user.test.js
const request = require('supertest');
const app = require('../app');
const { createTestUser } = require('./helpers/testFactory');

describe('  [USER ENGINE INTEGRATION TEST]', () => {
  it('1. Harus berhasil mengambil profil user & saldo dompet yang valid', async () => {
    // 💡 1 Baris Setup via Factory!
    const { token, user, wallet } = await createTestUser({ balance: 2500000 });

    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.profile.email).toBe(user.email);
    expect(res.body.data.wallet.balance).toBe(2500000);
  });

  it('2. Harus menolak akses profil jika tidak membawa Bearer Token (401)', async () => {
    const res = await request(app).get('/api/v1/users/me');

    expect(res.statusCode).toEqual(401);
    expect(res.body.status).toBe('fail');
  });
});