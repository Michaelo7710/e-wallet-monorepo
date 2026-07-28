const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Authentication
 *   description: Endpoints Manajemen Akses, Otentikasi User, Pemulihan Kredensial & 2FA
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Registrasi Akun Pengguna Baru
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, phone]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Michael S
 *               email:
 *                 type: string
 *                 example: user@greenpay.id
 *               password:
 *                 type: string
 *                 example: Password123!
 *               phone:
 *                 type: string
 *                 example: "081234567890"
 *     responses:
 *       201:
 *         description: Pendaftaran berhasil, kode OTP verifikasi telah dikirimkan ke email
 *       400:
 *         description: Format input salah atau Email/Nomor HP sudah terdaftar
 */
router.post('/register', authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Otentikasi Masuk Pengguna
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@greenpay.id
 *               password:
 *                 type: string
 *                 example: Password123!
 *     responses:
 *       200:
 *         description: Login berhasil, mengembalikan Access Token & Refresh Token JWT
 *       401:
 *         description: Kredensial tidak valid atau akun belum diverifikasi
 */
router.post('/login', authController.login);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     summary: Verifikasi Email Pengguna dengan Kode OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@greenpay.id
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email berhasil diverifikasi
 *       400:
 *         description: Kode OTP salah atau sudah kadaluwarsa
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     summary: Memperbarui Access Token yang Kadaluwarsa
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Access Token baru berhasil diterbitkan
 *       401:
 *         description: Refresh Token tidak valid atau expired
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Keluar dari Aplikasi (Invalidasi Session/Token)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Sesi pengguna berhasil diakhiri
 */
router.post('/logout', authController.logout);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Permintaan Kode/Link Permohonan Reset Password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@greenpay.id
 *     responses:
 *       200:
 *         description: Instruksi pemulihan kata sandi telah dikirim ke email
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Pembaruan Kata Sandi Baru
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: PasswordBaru123!
 *     responses:
 *       200:
 *         description: Kata sandi berhasil diperbarui
 */
router.post('/reset-password', authController.resetPassword);

// ==========================================
// LINTAS PROTOKOL KEAMANAN LAPIS BAJA (2FA)
// ==========================================
router.use(protect);

/**
 * @openapi
 * /auth/2fa/generate:
 *   post:
 *     summary: Membuat QR Code / Secret Key untuk Otentikasi Dua Faktor (2FA)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil membuat secret key & QR Code
 *       401:
 *         description: Tidak terotentikasi (Token Bearer hilang/invalid)
 */
router.post('/2fa/generate', authController.generate2FA);

/**
 * @openapi
 * /auth/2fa/verify:
 *   post:
 *     summary: Konfirmasi & Aktivasi Fitur 2FA
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 example: "654321"
 *     responses:
 *       200:
 *         description: 2FA berhasil diaktifkan
 */
router.post('/2fa/verify', authController.verify2FA);

module.exports = router;