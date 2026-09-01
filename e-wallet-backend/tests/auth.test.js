const request = require('supertest');
const app = require('../app');
const { User, VerificationCode, RefreshToken } = require('../src/models');
const { createTestUser } = require('./helpers/testFactory');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Helper untuk menghasilkan TOTP dari secret Base32
const generateTOTPCode = (secretBase32) => {
  const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bin = '';
  for (const char of secretBase32.toUpperCase()) {
    const idx = BASE32_ALPHABET.indexOf(char);
    bin += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i < bin.length; i += 8) {
    const sub = bin.substring(i, i + 8);
    if (sub.length === 8) bytes.push(parseInt(sub, 2));
  }
  const secretBuffer = Buffer.from(bytes);
  const counter = Math.floor(Date.now() / 30000);
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(counter, 4);

  const hmac = crypto.createHmac('sha1', secretBuffer).update(timeBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  return ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
};

describe('🧪 [AUTH ENGINE INTEGRATION TEST]', () => {
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

  it('4. Harus sukses generate 2FA dan verifikasi TOTP dengan header Bearer Token (Anti-IDOR)', async () => {
    const { accessToken, user } = await createTestUser();

    // 1. Generate 2FA Secret (hanya butuh Bearer token, tanpa userId di body)
    const genRes = await request(app)
      .post('/api/v1/auth/2fa/generate')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(genRes.statusCode).toEqual(200);
    expect(genRes.body.status).toBe('success');
    expect(genRes.body.data).toHaveProperty('secret');
    expect(genRes.body.data).toHaveProperty('otpauth_url');

    const { secret } = genRes.body.data;
    const totpToken = generateTOTPCode(secret);

    // 2. Verify 2FA (hanya kirim { token }, tanpa userId di body)
    const verifyRes = await request(app)
      .post('/api/v1/auth/2fa/verify')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ token: totpToken });

    expect(verifyRes.statusCode).toEqual(200);
    expect(verifyRes.body.status).toBe('success');

    // Pastikan status 2FA pada database aktif
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.two_factor_enabled).toBe(true);
  });

  it('5. Harus memblokir generate dan verify 2FA jika tidak menyertakan Bearer token (401)', async () => {
    const genRes = await request(app).post('/api/v1/auth/2fa/generate');
    expect(genRes.statusCode).toEqual(401);

    const verifyRes = await request(app)
      .post('/api/v1/auth/2fa/verify')
      .send({ token: '123456' });
    expect(verifyRes.statusCode).toEqual(401);
  });

  it('6. Harus menolak refresh token yang di-sign menggunakan JWT_SECRET (Isolasi Kriptografi)', async () => {
    const { user } = await createTestUser();

    // Buat token palsu yang ditandatangani dengan JWT_SECRET bukan JWT_REFRESH_SECRET
    const illegitimateToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await RefreshToken.create({
      user_id: user._id,
      token: illegitimateToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refresh_token: illegitimateToken });

    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toMatch(/Verifikasi refresh token gagal/i);
  });
});