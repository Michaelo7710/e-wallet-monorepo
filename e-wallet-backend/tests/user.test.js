// tests/user.test.js
const request = require('supertest');
const app = require('../app');
const { User, VerificationCode, RefreshToken } = require('../src/models');
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
    expect(res.body.data.profile.has_pin).toBe(true);
    expect(res.body.data.wallet.balance).toBe(5000000);

    // Verifikasi pengguna baru tanpa PIN menghasilkan has_pin: false
    const noPinUser = await createTestUser({ pin: null });
    const noPinRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${noPinUser.accessToken}`);
    expect(noPinRes.body.data.profile.has_pin).toBe(false);
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

  it('3b. [TASK-BE-07 DoD] Harus menerima PIN berupa integer 123456 dan menolak non-digit "12345a" atau digit kurang', async () => {
    // User tanpa PIN
    const { accessToken: tokenNoPin } = await createTestUser({ pin: null });

    // 1. Kirim "12345a" -> harus ditolak 400
    const resAlpha = await request(app)
      .post('/api/v1/users/setup-pin')
      .set('Authorization', `Bearer ${tokenNoPin}`)
      .send({ pin: '12345a' });
    expect(resAlpha.statusCode).toEqual(400);
    expect(resAlpha.body.message).toMatch(/6 digit angka murni/i);

    // 2. Kirim "12345" (5 digit) -> harus ditolak 400
    const resShort = await request(app)
      .post('/api/v1/users/setup-pin')
      .set('Authorization', `Bearer ${tokenNoPin}`)
      .send({ pin: '12345' });
    expect(resShort.statusCode).toEqual(400);
    expect(resShort.body.message).toMatch(/6 digit angka murni/i);

    // 3. Kirim integer 123456 (number) -> harus diterima 200
    const resInteger = await request(app)
      .post('/api/v1/users/setup-pin')
      .set('Authorization', `Bearer ${tokenNoPin}`)
      .send({ pin: 123456 });
    expect(resInteger.statusCode).toEqual(200);
    expect(resInteger.body.status).toBe('success');
    expect(resInteger.body.message).toMatch(/berhasil diaktifkan/i);
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

  it('9. Harus menolak pengajuan KYC jika akun belum mengaktifkan 2FA (400 Bad Request)', async () => {
    const { accessToken } = await createTestUser({
      two_factor_enabled: false,
      is_verified: false,
      account_tier: 'basic',
      is_kyc_verified: false,
    });

    const res = await request(app)
      .patch('/api/v1/users/update-kyc')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        nik: '3171012345670001',
        id_card_photo: 'data:image/jpeg;base64,samplektpimage',
        bio: 'Wiraswasta transaksi harian bisnis',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/Akun Anda wajib mengaktifkan proteksi 2FA/i);
  });

  it('10. Harus menolak pengajuan KYC jika parameter NIK, foto KTP, atau Bio tidak valid (400 Bad Request)', async () => {
    const { accessToken } = await createTestUser({
      two_factor_enabled: true,
      is_verified: false,
      account_tier: 'basic',
      is_kyc_verified: false,
    });

    // NIK salah (kurang dari 16 digit)
    const resNik = await request(app)
      .patch('/api/v1/users/update-kyc')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        nik: '12345',
        id_card_photo: 'data:image/jpeg;base64,samplektpimage',
        bio: 'Wiraswasta transaksi harian bisnis',
      });
    expect(resNik.statusCode).toEqual(400);
    expect(resNik.body.message).toMatch(/NIK wajib diisi dengan 16 digit/i);

    // Foto KTP kosong
    const resFoto = await request(app)
      .patch('/api/v1/users/update-kyc')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        nik: '3171012345670001',
        id_card_photo: '',
        bio: 'Wiraswasta transaksi harian bisnis',
      });
    expect(resFoto.statusCode).toEqual(400);
    expect(resFoto.body.message).toMatch(/Foto identitas KTP wajib dilampirkan/i);

    // Bio kurang dari 10 karakter
    const resBio = await request(app)
      .patch('/api/v1/users/update-kyc')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        nik: '3171012345670001',
        id_card_photo: 'data:image/jpeg;base64,samplektpimage',
        bio: 'Pendek',
      });
    expect(resBio.statusCode).toEqual(400);
    expect(resBio.body.message).toMatch(/minimal 10 karakter/i);
  });

  it('11. Harus sukses memproses KYC dan mempromosikan akun ke Premium saat 2FA aktif dan data lengkap (200 OK)', async () => {
    const { accessToken, user } = await createTestUser({
      two_factor_enabled: true,
      is_verified: false,
      account_tier: 'basic',
      is_kyc_verified: false,
    });

    const kycPayload = {
      nik: '3171012345670001',
      id_card_photo: 'data:image/jpeg;base64,samplevalidktp',
      bio: 'Wiraswasta kebutuhan transaksi grosir',
    };

    const res = await request(app)
      .patch('/api/v1/users/update-kyc')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(kycPayload);

    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('success');
    // TASK-BE-04: NIK & id_card_photo tidak boleh bocor di response JSON
    expect(res.body.data.nik).toBeUndefined();
    expect(res.body.data.id_card_photo).toBeUndefined();
    expect(res.body.data.bio).toBe(kycPayload.bio);
    expect(res.body.data.is_kyc_verified).toBe(true);
    expect(res.body.data.account_tier).toBe('premium');
    expect(res.body.data.is_verified).toBe(true);

    // Cek idempotensi: Pengajuan ulang setelah premium harus ditolak
    const resRepeat = await request(app)
      .patch('/api/v1/users/update-kyc')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(kycPayload);

    expect(resRepeat.statusCode).toEqual(400);
    expect(resRepeat.body.message).toMatch(/sudah berstatus terverifikasi premium/i);
  });

  it('12. [TASK-BE-08 DoD] Harus menolak pengajuan KYC jika NIK sudah digunakan oleh akun lain (400 Bad Request)', async () => {
    // User A: Berhasil submit KYC dengan NIK tertentu
    const { accessToken: tokenA } = await createTestUser({
      two_factor_enabled: true,
      is_verified: false,
      account_tier: 'basic',
      is_kyc_verified: false,
    });

    const sharedNik = '3201012345678901';

    const resUserA = await request(app)
      .patch('/api/v1/users/update-kyc')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        nik: sharedNik,
        id_card_photo: 'data:image/jpeg;base64,ktpuserA',
        bio: 'Pengusaha retail dan distribusi barang',
      });

    expect(resUserA.statusCode).toEqual(200);
    expect(resUserA.body.status).toBe('success');

    // User B: Coba mengajukan KYC menggunakan NIK yang sama persis
    const { accessToken: tokenB } = await createTestUser({
      two_factor_enabled: true,
      is_verified: false,
      account_tier: 'basic',
      is_kyc_verified: false,
    });

    const resUserB = await request(app)
      .patch('/api/v1/users/update-kyc')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        nik: sharedNik,
        id_card_photo: 'data:image/jpeg;base64,ktpuserB',
        bio: 'Pebisnis online transaksi harian',
      });

    expect(resUserB.statusCode).toEqual(400);
    expect(resUserB.body.status).toBe('fail');
    expect(resUserB.body.message).toMatch(/NIK sudah terdaftar pada akun lain/i);
  });

  it('13. [TASK-BE-09 DoD] Harus menginvalidasi seluruh active refresh token setelah pengguna mengganti password (401 saat refresh)', async () => {
    const { user, accessToken, refreshToken } = await createTestUser({ password: 'OldPassword123!' });

    // Simulasikan session aktif dengan mencatat refresh token di database
    await RefreshToken.create({
      user_id: user._id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const activeTokensBefore = await RefreshToken.find({ user_id: user._id });
    expect(activeTokensBefore.length).toBe(1);

    // Pengguna mengganti kata sandi
    const resUpdate = await request(app)
      .patch('/api/v1/users/update-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        old_password: 'OldPassword123!',
        new_password: 'NewPassword123!',
        confirm_new_password: 'NewPassword123!',
      });

    expect(resUpdate.statusCode).toEqual(200);
    expect(resUpdate.body.status).toBe('success');

    // Seluruh refresh token untuk user tersebut wajib telah dimusnahkan
    const activeTokensAfter = await RefreshToken.find({ user_id: user._id });
    expect(activeTokensAfter.length).toBe(0);

    // Refresh token lama wajib ditolak saat dicoba untuk refresh access token (401)
    const resRefresh = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refresh_token: refreshToken });

    expect(resRefresh.statusCode).toEqual(401);
    expect(resRefresh.body.message).toMatch(/Refresh token tidak valid atau telah kedaluwarsa/i);
  });

  it('14. [TASK-BE-09 DoD] Harus menginvalidasi seluruh active refresh token setelah pengguna mengganti email (401 saat refresh)', async () => {
    const { user, accessToken, refreshToken } = await createTestUser();

    // Simulasikan session aktif dengan mencatat refresh token di database
    await RefreshToken.create({
      user_id: user._id,
      token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Generate VerificationCode untuk change_email
    const otpCode = '654321';
    await VerificationCode.create({
      user_id: user._id,
      code: otpCode,
      type: 'change_email',
      expires_at: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Pengguna mengganti email
    const resUpdateEmail = await request(app)
      .patch('/api/v1/users/update-email')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        new_email: `invalidated_session_${Date.now()}@test.com`,
        otp: otpCode,
        pin: '123456',
      });

    expect(resUpdateEmail.statusCode).toEqual(200);
    expect(resUpdateEmail.body.status).toBe('success');

    // Seluruh refresh token untuk user tersebut wajib telah dimusnahkan
    const activeTokensAfter = await RefreshToken.find({ user_id: user._id });
    expect(activeTokensAfter.length).toBe(0);

    // Refresh token lama wajib ditolak (401)
    const resRefresh = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refresh_token: refreshToken });

    expect(resRefresh.statusCode).toEqual(401);
    expect(resRefresh.body.message).toMatch(/Refresh token tidak valid atau telah kedaluwarsa/i);
  });
});