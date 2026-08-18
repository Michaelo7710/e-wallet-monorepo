// const request = require('supertest');
// const app = require('../app');
// const { User, VerificationCode } = require('../src/models');

// describe('🧪 [AUTH ENGINE INTEGRATION TEST]', () => {

//   it('1. Harus sukses mendaftarkan pengguna baru (Register)', async () => {
//     const res = await request(app)
//       .post('/api/v1/auth/register')
//       .send({
//         username: 'Ahmad Test',
//         email: 'ahmad@test.com',
//         password: 'Password123!',
//         phone_number: '081234567890'
//       });

//     expect(res.statusCode).toEqual(201); // atau 200/201 sesuai status register
//     expect(res.body.status).toBe('success');
//     expect(res.body.data.user).toHaveProperty('email', 'ahmad@test.com');

//     // Pastikan kode OTP tersimpan di database memory
//     const otp = await VerificationCode.findOne({ type: 'email_verification' });
//     expect(otp).not.toBeNull();
//   });

//   it('2. Harus sukses verifikasi email OTP dan login (Dual-Token Check)', async () => {
//     // Phase A: Buat User & OTP langsung di DB
//     const user = await User.create({
//       username: 'Budi Test',
//       email: 'budi@test.com',
//       password: 'Password123!',
//       phone_number: '089876543210',
//       is_verified: false
//     });

//     await VerificationCode.create({
//       user_id: user._id,
//       code: '123456',
//       type: 'email_verification',
//       expires_at: new Date(Date.now() + 10 * 60 * 1000)
//     });

//     // Phase B: Eksekusi Verifikasi OTP
//     const verifyRes = await request(app)
//       .post('/api/v1/auth/verify-email')
//       .send({ email: 'budi@test.com', code: '123456' });

//     expect(verifyRes.statusCode).toEqual(200);

//     // Phase C: Eksekusi Login
//     const loginRes = await request(app)
//       .post('/api/v1/auth/login')
//       .send({ email: 'budi@test.com', password: 'Password123!' });

//     expect(loginRes.statusCode).toEqual(200);
//     expect(loginRes.body.data).toHaveProperty('access_token');
//     expect(loginRes.body.data).toHaveProperty('refresh_token');
//   });

// });

const request = require('supertest');
const app = require('../app');
const { User, VerificationCode, RefreshToken } = require('../src/models');
const { createTestUser } = require('./helpers/testFactory');

describe('  [AUTH ENGINE INTEGRATION TEST]', () => {
  it('1. Harus sukses mendaftarkan pengguna baru (Register)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'Ahmad Test',
        email: 'ahmad@test.com',
        password: 'Password123!',
        phone_number: '081234567890',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user).toHaveProperty('email', 'ahmad@test.com');

    const otp = await VerificationCode.findOne({ type: 'email_verification' });
    expect(otp).not.toBeNull();
  });

  it('2. Harus sukses verifikasi email OTP dan login (Dual-Token Check)', async () => {
    const user = await User.create({
      username: 'Budi Test',
      email: 'budi@test.com',
      password: 'Password123!',
      phone_number: '089876543210',
      is_verified: false,
    });

    await VerificationCode.create({
      user_id: user._id,
      code: '123456',
      type: 'email_verification',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ email: 'budi@test.com', code: '123456' });

    expect(verifyRes.statusCode).toEqual(200);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'budi@test.com', password: 'Password123!' });

    expect(loginRes.statusCode).toEqual(200);
    expect(loginRes.body.data).toHaveProperty('access_token');
    expect(loginRes.body.data).toHaveProperty('refresh_token');
  });

  it('3. Harus sukses rotasi Refresh Token dan Logout', async () => {
    const { user, refreshToken } = await createTestUser();

    await RefreshToken.create({
      user_id: user._id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Refresh Token Request
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refresh_token: refreshToken });

    expect(refreshRes.statusCode).toEqual(200);
    expect(refreshRes.body.data).toHaveProperty('access_token');

    // Logout Request
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refresh_token: refreshToken });

    expect(logoutRes.statusCode).toEqual(200);
  });
});