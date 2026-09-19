const request = require('supertest');
const app = require('../app');
const { User, Wallet, RefreshToken } = require('../src/models');
const { createTestUser, createTestAdmin } = require('./helpers/testFactory');

describe('🧪 [TASK-ADM-03: ANTI-FRAUD CIRCUIT & ADMIN USER GOVERNANCE]', () => {
  let adminToken;
  let adminUser;

  beforeEach(async () => {
    const adminRes = await createTestAdmin();
    adminToken = adminRes.token;
    adminUser = adminRes.admin;
  });

  describe('Part 1: RBAC & Access Control Guard', () => {
    it('1. Harus menolak akses GET /admin/users dari user non-admin (403 Forbidden)', async () => {
      const { token: userToken } = await createTestUser();

      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toBe('fail');
    });

    it('2. Harus menolak akses PATCH /admin/users/:id/freeze dari user non-admin (403 Forbidden)', async () => {
      const { user, token: userToken } = await createTestUser();

      const res = await request(app)
        .patch(`/api/v1/admin/users/${user._id}/freeze`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Percobaan penipuan' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toBe('fail');
    });

    it('3. Harus menolak request tanpa token otentikasi (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/v1/admin/users');

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('fail');
    });
  });

  describe('Part 2: Directory Query, Filter & Keyset Cursor Pagination', () => {
    it('4. Harus sukses menarik daftar pengguna dengan saldo dompet dan meta pagination (200 OK)', async () => {
      const { user: userA, wallet: walletA } = await createTestUser({ balance: 500000 });

      const res = await request(app)
        .get('/api/v1/admin/users?limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toEqual(
        expect.objectContaining({
          limit: 10,
        })
      );

      // Cari userA dalam response
      const found = res.body.data.find((u) => u._id.toString() === userA._id.toString());
      expect(found).toBeDefined();
      expect(found.balance).toBe(500000);
      expect(found).not.toHaveProperty('password');
      expect(found).not.toHaveProperty('pin');
      expect(found).not.toHaveProperty('two_factor_secret');
    });

    it('5. Harus memfilter pengguna berdasarkan keyword pencarian (username/email/phone/NIK)', async () => {
      const uniqueUsername = `Fraudster_${Date.now()}`;
      const { user } = await createTestUser({
        username: uniqueUsername,
        email: `suspect_${Date.now()}@target.com`,
        phone_number: '0898877665544',
        nik: '3201123456780009',
      });

      // Filter by username
      const resUsername = await request(app)
        .get(`/api/v1/admin/users?search=${uniqueUsername}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resUsername.statusCode).toEqual(200);
      expect(resUsername.body.data.length).toBeGreaterThanOrEqual(1);
      expect(resUsername.body.data[0].username).toBe(uniqueUsername);

      // Filter by NIK
      const resNik = await request(app)
        .get('/api/v1/admin/users?search=3201123456780009')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resNik.statusCode).toEqual(200);
      expect(resNik.body.data.length).toBeGreaterThanOrEqual(1);
      expect(resNik.body.data[0].nik).toBe('3201123456780009');
    });

    it('6. Harus memfilter pengguna berdasarkan tier dan status penangguhan (is_suspended)', async () => {
      const { user: suspendedUser } = await createTestUser({
        is_suspended: true,
        suspend_reason: 'Testing Suspend Filter',
      });

      const resSuspended = await request(app)
        .get('/api/v1/admin/users?is_suspended=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resSuspended.statusCode).toEqual(200);
      const allSuspended = resSuspended.body.data.every((u) => u.is_suspended === true);
      expect(allSuspended).toBe(true);
    });

    it('7. Harus mendukung keyset cursor pagination berjalan berurutan', async () => {
      // Buat 3 user
      await createTestUser();
      await createTestUser();
      await createTestUser();

      const page1 = await request(app)
        .get('/api/v1/admin/users?limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(page1.statusCode).toEqual(200);
      expect(page1.body.data.length).toBe(2);

      if (page1.body.meta.next_cursor) {
        const page2 = await request(app)
          .get(`/api/v1/admin/users?limit=2&cursor=${page1.body.meta.next_cursor}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(page2.statusCode).toEqual(200);
        expect(page2.body.data.length).toBeGreaterThanOrEqual(1);
        // Pastikan tidak ada overlap ID antara page 1 dan page 2
        const page1Ids = page1.body.data.map((u) => u._id);
        const page2Ids = page2.body.data.map((u) => u._id);
        const overlap = page1Ids.some((id) => page2Ids.includes(id));
        expect(overlap).toBe(false);
      }
    });
  });

  describe('Part 3: Freeze User Circuit & Session Destruction', () => {
    it('8. Harus membekukan user, mencatat alasan & timestamp, dan menghapus seluruh active refresh token (200 OK)', async () => {
      const { user, refreshToken } = await createTestUser();

      // Simpan refresh token ke database layaknya user sedang login aktif
      await RefreshToken.create({
        user_id: user._id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Verifikasi token tersimpan sebelum freeze
      const tokensBefore = await RefreshToken.find({ user_id: user._id });
      expect(tokensBefore.length).toBe(1);

      // Eksekusi Freeze
      const reasonText = 'Terdeteksi transaksi anomali pencucian uang';
      const freezeRes = await request(app)
        .patch(`/api/v1/admin/users/${user._id}/freeze`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: reasonText });

      expect(freezeRes.statusCode).toEqual(200);
      expect(freezeRes.body.status).toBe('success');
      expect(freezeRes.body.data.user.is_suspended).toBe(true);
      expect(freezeRes.body.data.user.suspend_reason).toBe(reasonText);
      expect(freezeRes.body.data.user.suspended_at).toBeDefined();

      // Verifikasi BENTENG ANTI-FRAUD: Refresh Token harus musnah total dari DB
      const tokensAfter = await RefreshToken.find({ user_id: user._id });
      expect(tokensAfter.length).toBe(0);

      // Verifikasi di DB User
      const updatedUserInDb = await User.findById(user._id);
      expect(updatedUserInDb.is_suspended).toBe(true);
      expect(updatedUserInDb.suspend_reason).toBe(reasonText);
      expect(updatedUserInDb.suspended_at).toBeInstanceOf(Date);
    });

    it('9. Harus menolak pembekuan akun administrator (400 Bad Request)', async () => {
      const anotherAdmin = await createTestAdmin();

      const res = await request(app)
        .patch(`/api/v1/admin/users/${anotherAdmin.admin._id}/freeze`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Percobaan bekukan admin' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('administrator');
    });

    it('10. Harus mengembalikan 404 jika ID user tidak ditemukan', async () => {
      const fakeId = '60d5ec49f1b2c8b1f8e4e1a1';

      const res = await request(app)
        .patch(`/api/v1/admin/users/${fakeId}/freeze`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'User hantu' });

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('Part 4: Circuit Breaker Enforcement on Suspended User', () => {
    it('11. Pengguna yang dibekukan harus diblokir oleh authMiddleware dengan HTTP 403 Forbidden', async () => {
      const { user, accessToken } = await createTestUser();

      // Freeze the user
      await request(app)
        .patch(`/api/v1/admin/users/${user._id}/freeze`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Akun disuspend untuk investigasi' });

      // User mencoba mengakses endpoint profil yang diprotect
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toContain('ditangguhkan');
    });

    it('12. Pengguna yang dibekukan harus ditolak saat mencoba login kembali dengan HTTP 403 Forbidden', async () => {
      const rawPassword = 'Password123!';
      const { user } = await createTestUser({ password: rawPassword, is_email_verified: true });

      // Freeze user
      await request(app)
        .patch(`/api/v1/admin/users/${user._id}/freeze`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Suspended account' });

      // Attempt login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: rawPassword,
        });

      expect(loginRes.statusCode).toEqual(403);
      expect(loginRes.body.message).toContain('ditangguhkan');
    });
  });

  describe('Part 5: Unfreeze User Restoration', () => {
    it('13. Harus memulihkan status akun pengguna (unfreeze) dan membersihkan alasan suspend (200 OK)', async () => {
      const { user } = await createTestUser({
        is_suspended: true,
        suspend_reason: 'Alasan lama',
        suspended_at: new Date(),
      });

      const res = await request(app)
        .patch(`/api/v1/admin/users/${user._id}/unfreeze`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.is_suspended).toBe(false);
      expect(res.body.data.user.suspend_reason).toBeNull();
      expect(res.body.data.user.suspended_at).toBeNull();

      // Verifikasi di database
      const restoredUser = await User.findById(user._id);
      expect(restoredUser.is_suspended).toBe(false);
      expect(restoredUser.suspend_reason).toBeNull();
      expect(restoredUser.suspended_at).toBeNull();
    });
  });
});
