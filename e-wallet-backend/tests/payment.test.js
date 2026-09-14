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

  it('5. Harus menolak Top Up jika akumulasi saldo melebihi limit Rp 5.000.000 untuk akun Non-KYC (400)', async () => {
    const { accessToken } = await createTestUser({
      is_verified: false,
      balance: 4000000,
    });

    const res = await request(app)
      .post('/api/v1/payments/topup/initiate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 2000000 }); // 4jt + 2jt = 6jt > limit 5jt

    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toBe('fail');
    expect(res.body.error_code).toBe('WALLET_LIMIT_EXCEEDED');
    expect(res.body.message).toMatch(/Batas maksimum saldo untuk akun Anda adalah Rp 5\.000\.000/i);
  });

  it('6. Harus mengizinkan Top Up di atas Rp 5.000.000 (hingga Rp 50.000.000) jika akun sudah berstatus KYC Terverifikasi (is_verified: true)', async () => {
    const { accessToken } = await createTestUser({
      is_verified: true,
      balance: 4000000,
    });

    const res = await request(app)
      .post('/api/v1/payments/topup/initiate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 6000000 }); // 4jt + 6jt = 10jt <= limit 50jt

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('snap_token');
  });

  it('7. Simulator/Webhook Midtrans legacy path /api/transactions/midtrans-notification harus mengembalikan 200 OK dan menambah saldo dompet di MongoDB', async () => {
    const crypto = require('crypto');
    const { Wallet, TopUpRequest } = require('../src/models');
    const { accessToken, user } = await createTestUser({ balance: 50000 });

    const initRes = await request(app)
      .post('/api/v1/payments/topup/initiate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 100000 });

    expect(initRes.statusCode).toEqual(201);
    const orderId = initRes.body.data.reference_number;
    const statusCode = '200';
    const grossAmount = '100000.00';
    const MOCK_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'mock-sandbox-server-key-test-99999';
    const signatureKey = crypto
      .createHash('sha512')
      .update(orderId + statusCode + grossAmount + MOCK_SERVER_KEY)
      .digest('hex');

    const webhookRes = await request(app)
      .post('/api/transactions/midtrans-notification')
      .send({
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signatureKey,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        transaction_id: 'midtrans-trx-mock-001',
        payment_type: 'gopay',
        settlement_time: '2026-09-07 10:00:00',
      });

    expect(webhookRes.statusCode).toEqual(200);
    expect(webhookRes.body.status).toBe('success');

    const updatedWallet = await Wallet.findOne({ user_id: user._id });
    expect(updatedWallet.balance).toBe(150000);

    const updatedTopUp = await TopUpRequest.findOne({ reference_number: orderId });
    expect(updatedTopUp.status).toBe('success');
  });

  it('8. Simulator/Webhook Midtrans path /api/v1/transactions/midtrans-notification harus mengembalikan 200 OK dan menambah saldo dompet', async () => {
    const crypto = require('crypto');
    const { Wallet } = require('../src/models');
    const { accessToken, user } = await createTestUser({ balance: 25000 });

    const initRes = await request(app)
      .post('/api/v1/payments/topup/initiate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 75000 });

    expect(initRes.statusCode).toEqual(201);
    const orderId = initRes.body.data.reference_number;
    const statusCode = '200';
    const grossAmount = '75000.00';
    const MOCK_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'mock-sandbox-server-key-test-99999';
    const signatureKey = crypto
      .createHash('sha512')
      .update(orderId + statusCode + grossAmount + MOCK_SERVER_KEY)
      .digest('hex');

    const webhookRes = await request(app)
      .post('/api/v1/transactions/midtrans-notification')
      .send({
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signatureKey,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        transaction_id: 'midtrans-trx-mock-002',
        payment_type: 'bank_transfer',
        settlement_time: '2026-09-07 10:00:00',
      });

    expect(webhookRes.statusCode).toEqual(200);
    expect(webhookRes.body.status).toBe('success');

    const updatedWallet = await Wallet.findOne({ user_id: user._id });
    expect(updatedWallet.balance).toBe(100000);
  });

  it('9. Webhook Midtrans route alias /api/v1/payments/midtrans-notification harus mengembalikan 200 OK', async () => {
    const crypto = require('crypto');
    const { Wallet } = require('../src/models');
    const { accessToken, user } = await createTestUser({ balance: 0 });

    const initRes = await request(app)
      .post('/api/v1/payments/topup/initiate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ amount: 50000 });

    expect(initRes.statusCode).toEqual(201);
    const orderId = initRes.body.data.reference_number;
    const statusCode = '200';
    const grossAmount = '50000.00';
    const MOCK_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'mock-sandbox-server-key-test-99999';
    const signatureKey = crypto
      .createHash('sha512')
      .update(orderId + statusCode + grossAmount + MOCK_SERVER_KEY)
      .digest('hex');

    const webhookRes = await request(app)
      .post('/api/v1/payments/midtrans-notification')
      .send({
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signatureKey,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        transaction_id: 'midtrans-trx-mock-003',
        payment_type: 'qris',
        settlement_time: '2026-09-07 10:00:00',
      });

    expect(webhookRes.statusCode).toEqual(200);
    expect(webhookRes.body.status).toBe('success');

    const updatedWallet = await Wallet.findOne({ user_id: user._id });
    expect(updatedWallet.balance).toBe(50000);
  });

  it('10. Endpoint Remote Config GET /api/v1/config/feature-flags harus mengembalikan 200 OK dengan status success dan daftar feature flags', async () => {
    const res = await request(app).get('/api/v1/config/feature-flags');

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toEqual({
      p2p_transfer: { enabled: true },
      topup_midtrans: { enabled: true },
      bank_withdrawal: { enabled: true },
      kyc_submission: { enabled: true },
      biometric_login: { enabled: true },
    });
  });
});