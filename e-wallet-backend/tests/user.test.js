// tests/user.test.js
const request = require('supertest');
const app = require('../app');
const { User, VerificationCode } = require('../src/models');
const { createTestUser } = require('./helpers/testFactory');
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

describe('🧪 [USER ENGINE INTEGRATION TEST]', () => {
  
  it('1. Harus sukses mengambil profil pengguna & saldo dompet bawaan yang sah (200)', async () => {
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
    const { accessToken } = await createTestUser({ pin: '123456' });

    const res = await request(app)
      .post('/api/v1/users/setup-pin')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ pin: '654321' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.status).toBe('fail');
  });

  it('4. Harus sukses memperbarui email dengan tiket VerificationCode (type: change_email) yang valid (200)', async () => {
    const { accessToken, user } = await createTestUser();
    const newEmail = `updated_${Date.now()}@test.com`;

    // Buat tiket OTP di database
    const otpCode = '789012';
    await VerificationCode.create({
      user_id: user._id,
      code: otpCode,
      type: 'change_email',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      is_used: false,
    });

    const res = await request(app)
      .patch('/api/v1/users/update-email')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        new_email: newEmail,
        otp: otpCode,
        pin: '123456',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');
    expect(res.body.email).toBe(newEmail);

    // Verifikasi mutasi data di database
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.email).toBe(newEmail);

    // Verifikasi tiket OTP terkunci (is_used: true) untuk mencegah replay attack
    const usedOtp = await VerificationCode.findOne({ user_id: user._id, code: otpCode, type: 'change_email' });
    expect(usedOtp.is_used).toBe(true);
  });

  it('5. Harus gagal memperbarui email jika kode OTP salah atau kedaluwarsa (400 Bad Request)', async () => {
    const { accessToken, user } = await createTestUser();

    // Skenario A: Kode OTP salah
    const resWrongOtp = await request(app)
      .patch('/api/v1/users/update-email')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        new_email: 'wrongotp@test.com',
        otp: '999999',
        pin: '123456',
      });

    expect(resWrongOtp.statusCode).toEqual(400);
    expect(resWrongOtp.body.message).toMatch(/Kode OTP pembaruan email tidak valid atau telah kedaluwarsa/i);

    // Skenario B: Kode OTP kedaluwarsa
    const expiredOtpCode = '112233';
    await VerificationCode.create({
      user_id: user._id,
      code: expiredOtpCode,
      type: 'change_email',
      expires_at: new Date(Date.now() - 1000), // Sudah expired
      is_used: false,
    });

    const resExpiredOtp = await request(app)
      .patch('/api/v1/users/update-email')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        new_email: 'expiredotp@test.com',
        otp: expiredOtpCode,
        pin: '123456',
      });

    expect(resExpiredOtp.statusCode).toEqual(400);
  });

  it('6. Harus sukses memperbarui PIN transaksi dengan tiket VerificationCode (type: change_pin) yang valid (200)', async () => {
    const { accessToken, user } = await createTestUser();
    const otpCode = '654987';

    await VerificationCode.create({
      user_id: user._id,
      code: otpCode,
      type: 'change_pin',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
      is_used: false,
    });

    const res = await request(app)
      .patch('/api/v1/users/update-pin')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        old_pin: '123456',
        otp: otpCode,
        new_pin: '987654',
        confirm_new_pin: '987654',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');

    // Verifikasi PIN baru berfungsi
    const updatedUser = await User.findById(user._id).select('+pin');
    const isNewPinCorrect = await updatedUser.correctPin('987654', updatedUser.pin);
    expect(isNewPinCorrect).toBe(true);

    // Verifikasi OTP terkunci
    const usedOtp = await VerificationCode.findOne({ user_id: user._id, code: otpCode, type: 'change_pin' });
    expect(usedOtp.is_used).toBe(true);
  });

  it('7. Harus gagal memperbarui PIN transaksi jika kode OTP salah (400 Bad Request)', async () => {
    const { accessToken } = await createTestUser();

    const res = await request(app)
      .patch('/api/v1/users/update-pin')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        old_pin: '123456',
        otp: '000000', // Salah
        new_pin: '987654',
        confirm_new_pin: '987654',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/Kode OTP pembaruan PIN tidak valid atau telah kedaluwarsa/i);
  });

  it('8. Harus mendukung validasi 2FA TOTP dinamis saat user mengaktifkan 2FA', async () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const { accessToken, user } = await createTestUser({
      two_factor_enabled: true,
      two_factor_secret: secret,
    });

    const validTotp = generateTOTPCode(secret);

    // Sukses Update Email dengan TOTP 2FA
    const resEmail = await request(app)
      .patch('/api/v1/users/update-email')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        new_email: `2fa_updated_${Date.now()}@test.com`,
        otp: validTotp,
        pin: '123456',
      });

    expect(resEmail.statusCode).toEqual(200);

    // Gagal Update PIN dengan TOTP 2FA salah (401 Unauthorized)
    const resPinWrong = await request(app)
      .patch('/api/v1/users/update-pin')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        old_pin: '123456',
        otp: '000000',
        new_pin: '888999',
        confirm_new_pin: '888999',
      });

    expect(resPinWrong.statusCode).toEqual(401);
    expect(resPinWrong.body.message).toMatch(/Token otentikasi 2FA tidak valid atau telah kedaluwarsa/i);
  });
});