/**
 * @openapi
 * tags:
 *   name: Users
 *   description: Endpoints Navigasi Profil, Aktivasi PIN, dan KYC Premium
 */

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Ambil profil & informasi saldo dompet pengguna aktif
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sinkronisasi data profil dan saldo berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Data profil dan informasi saldo berhasil diselaraskan.
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile:
 *                       $ref: '#/components/schemas/User'
 *                     wallet:
 *                       type: object
 *                       properties:
 *                         balance:
 *                           type: number
 *                           example: 5000000
 *                         currency:
 *                           type: string
 *                           example: IDR
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */

/**
 * @openapi
 * /users/setup-pin:
 *   post:
 *     summary: Aktivasi PIN Transaksi Perdana (Hanya Bisa 1 Kali)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pin]
 *             properties:
 *               pin:
 *                 type: string
 *                 example: "123456"
 *                 description: 6 Digit angka transaksi rahasia
 *     responses:
 *       200:
 *         description: PIN Berhasil diaktifkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "PIN transaksi berhasil diaktifkan."
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */

/**
 * @openapi
 * /users/update-kyc:
 *   patch:
 *     summary: Upgrade Akun ke Status Premium Terverifikasi (Simulasi KYC via NIK)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nik]
 *             properties:
 *               nik:
 *                 type: string
 *                 example: "3201123456780001"
 *                 description: 16 Digit NIK valid
 *     responses:
 *       200:
 *         description: Akun berhasil di-upgrade ke premium
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Verifikasi KYC berhasil dikonfirmasi. Akun Anda kini berstatus Premium."
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 *       500:
 *         $ref: '#/components/responses/500InternalServerError'
 */
