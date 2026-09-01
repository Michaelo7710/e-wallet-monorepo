const request = require('supertest');
const app = require('../app');
const { User, Wallet, Transaction } = require('../src/models');
const { signAccessToken } = require('../src/utils/jwt');

describe('🧪 [P2P TRANSFER & AML INTEGRATION TEST]', () => {
  let senderToken, senderUser, receiverUser, senderWallet, receiverWallet;

  beforeEach(async () => {
    // Inisialisasi User Pengirim & Penerima di Memory DB
    senderUser = await User.create({
      username: 'Pengirim',
      email: 'sender@test.com',
      password: 'Password123!',
      phone_number: '081111111111',
      pin: '123456',
      is_verified: true
    });

    receiverUser = await User.create({
      username: 'Penerima',
      email: 'receiver@test.com',
      password: 'Password123!',
      phone_number: '082222222222',
      pin: '123456',
      is_verified: true
    });

    senderWallet = await Wallet.create({ user_id: senderUser._id, balance: 20000000 }); // Saldo 20 Juta
    receiverWallet = await Wallet.create({ user_id: receiverUser._id, balance: 100000 });  // Saldo 100 Ribu

    senderToken = signAccessToken(senderUser._id, senderUser.role);
  });

  it('1. Transfer < 10 Juta harus langsung SUKSES dan memutasi saldo instan', async () => {
    const res = await request(app)
      .post('/api/v1/payments/transfer')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        receiver_phone_number: '082222222222',
        amount: 500000, // 500 Ribu
        pin: '123456'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.status).toBe('success');

    // Cek Mutasi Saldo di Memory DB
    const updatedSender = await Wallet.findOne({ user_id: senderUser._id });
    const updatedReceiver = await Wallet.findOne({ user_id: receiverUser._id });

    expect(updatedSender.balance).toBe(19500000); // 20 Juta - 500rb
    expect(updatedReceiver.balance).toBe(600000);  // 100rb + 500rb
  });

  it('2. Transfer >= 10 Juta harus TERTANAM di status PENDING_APPROVAL (Hold Mechanism)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/transfer')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        receiver_phone_number: '082222222222',
        amount: 15000000, // 15 Juta (High-Value)
        pin: '123456'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.status).toBe('pending_approval');
    expect(res.body.data.is_high_value).toBe(true);

    // Saldo pengirim dipotong, TAPI saldo penerima BELUM bertambah (ditahan)
    const updatedSender = await Wallet.findOne({ user_id: senderUser._id });
    const updatedReceiver = await Wallet.findOne({ user_id: receiverUser._id });

    expect(updatedSender.balance).toBe(5000000); // 20 Juta - 15 Juta
    expect(updatedReceiver.balance).toBe(100000); // Masih tetap 100 Ribu
  });

  it('3. Harus menolak transfer jika saldo pengirim tidak mencukupi (400)', async () => {
    const res = await request(app)
      .post('/api/v1/payments/transfer')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        receiver_phone_number: '082222222222',
        amount: 25000000, // 25 Juta (lebih dari saldo 20 Juta)
        pin: '123456'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toBe('fail');
  });

  it('4. Proteksi Double-Spending: Dua request transfer paralel hanya 1 yang lolos jika saldo terbatas', async () => {
    // Set saldo sender ke 15 Juta
    await Wallet.updateOne({ user_id: senderUser._id }, { balance: 15000000 });

    // Request 2x transfer @ 10 Juta bersamaan (Total 20 Juta > Saldo 15 Juta)
    const [res1, res2] = await Promise.all([
      request(app)
        .post('/api/v1/payments/transfer')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiver_phone_number: '082222222222',
          amount: 10000000,
          pin: '123456'
        }),
      request(app)
        .post('/api/v1/payments/transfer')
        .set('Authorization', `Bearer ${senderToken}`)
        .send({
          receiver_phone_number: '082222222222',
          amount: 10000000,
          pin: '123456'
        })
    ]);

    const statuses = [res1.statusCode, res2.statusCode].sort();
    expect(statuses).toEqual([200, 400]);

    const updatedSender = await Wallet.findOne({ user_id: senderUser._id });
    expect(updatedSender.balance).toBe(5000000); // 15 Juta - 10 Juta (hanya satu mutasi yang berhasil)
  });
});