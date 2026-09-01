const request = require('supertest');
const app = require('../app');
const { createTestUser } = require('./helpers/testFactory');

describe('🧪 [PAYMENT & TRANSACTION INTEGRATION TEST]', () => {
  it('1. Harus menolak inisialisasi Top-Up jika nominal di bawah batas minimum Rp 10.000 (400)', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .post('/api/v1/payments/topup/initiate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 5000 }); // Di bawah minimum Rp 10.000

    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toBe('fail');
  });

  it('2. Harus sukses memproses permohonan penarikan dana jika saldo mencukupi (200)', async () => {
    const { accessToken, wallet } = await createTestUser({ balance: 2000000 });

    const res = await request(app)
      .post('/api/v1/payments/withdrawal/request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bank_name: 'BCA',
        account_number: '1234567890',
        account_name: 'Tester Akun',
        amount: 500000,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.amount).toBe(500000);
  });

  it('3. Harus menolak penarikan dana jika saldo dompet tidak mencukupi (400)', async () => {
    const { accessToken } = await createTestUser({ balance: 10000 }); // Saldo cuma 10rb

    const res = await request(app)
      .post('/api/v1/payments/withdrawal/request')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bank_name: 'BCA',
        account_number: '1234567890',
        account_name: 'Tester Akun',
        amount: 100000, // Menarik 100rb
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toBe('fail');
  });

  it('4. Proteksi Double-Spending Withdrawal: Dua request penarikan paralel hanya 1 yang lolos jika saldo terbatas', async () => {
    const { accessToken, user, wallet } = await createTestUser({ balance: 100000 }); // Saldo 100rb

    // Dua request penarikan @ 75rb bersamaan (Total 150rb > Saldo 100rb)
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/payments/withdrawal/request')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          bank_name: 'BCA',
          account_number: '1234567890',
          account_name: 'Tester Akun',
          amount: 75000,
        }),
      request(app)
        .post('/api/v1/payments/withdrawal/request')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          bank_name: 'BCA',
          account_number: '1234567890',
          account_name: 'Tester Akun',
          amount: 75000,
        }),
    ]);

    const statuses = [res1.statusCode, res2.statusCode].sort();
    expect(statuses).toEqual([200, 400]);

    const { Wallet } = require('../src/models');
    const updatedWallet = await Wallet.findOne({ user_id: user._id });
    expect(updatedWallet.balance).toBe(25000); // 100rb - 75rb
  });
});