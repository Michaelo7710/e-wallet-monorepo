/**
 * @openapi
 * tags:
 *   name: Authentication
 *   description: Endpoints Otentikasi User, Verifikasi, Pemulihan Kredensial & 2FA
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Registrasi Akun Pengguna Baru
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, phone_number]
 *             properties:
 *               username: { type: string, example: "Michael S" }
 *               email: { type: string, example: "user@greenpay.id" }
 *               password: { type: string, example: "Password123!" }
 *               phone_number: { type: string, example: "081234567890" }
 *     responses:
 *       201:
 *         description: Registrasi berhasil, OTP terkirim ke email
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthSuccessResponse' }
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Otentikasi Masuk Pengguna
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "user@greenpay.id" }
 *               password: { type: string, example: "Password123!" }
 *     responses:
 *       200:
 *         description: Login Berhasil, mengembalikan Dual-Token JWT
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthSuccessResponse' }
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 */

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     summary: Verifikasi OTP Email Pengguna
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string, example: "user@greenpay.id" }
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/200OK'
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 */

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     summary: Rotasi Access Token Baru
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refresh_token]
 *             properties:
 *               refresh_token: { type: string }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/200OK'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 */

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Keluar Aplikasi (Invalidasi Refresh Token)
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               refresh_token: { type: string }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/200OK'
 */

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Permintaan OTP Reset Password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: "user@greenpay.id" }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/200OK'
 */

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Eksekusi Reset Password Baru
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, new_password]
 *             properties:
 *               email: { type: string, example: "user@greenpay.id" }
 *               otp: { type: string, example: "123456" }
 *               new_password: { type: string, example: "PasswordBaru123!" }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/200OK'
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 */

/**
 * @openapi
 * /auth/2fa/generate:
 *   post:
 *     summary: Generate Secret Key & TOTP URL 2FA
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         $ref: '#/components/responses/200OK'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 */

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
 *               token: { type: string, example: "654321" }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/200OK'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 */