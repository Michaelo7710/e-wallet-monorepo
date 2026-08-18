/**
 * @openapi
 * tags:
 *   name: Admin
 *   description: Endpoints Operasional Khusus Administrator (Role Admin Only)
 */

/**
 * @openapi
 * /admin/banks:
 *   post:
 *     summary: Daftarkan Rekening Master Platform Baru
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bank_name, account_number, account_holder_name]
 *             properties:
 *               bank_name:
 *                 type: string
 *                 example: "BCA"
 *               account_number:
 *                 type: string
 *                 example: "1234567890"
 *               account_holder_name:
 *                 type: string
 *                 example: "PT GreenPay Digital Indonesia"
 *     responses:
 *       201:
 *         description: Rekening master baru berhasil didaftarkan
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 *
 *   get:
 *     summary: Ambil Seluruh Daftar Rekening Master Platform
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         $ref: '#/components/responses/200OK'
 *       403:
 *         $ref: '#/components/responses/403Forbidden'
 */

/**
 * @openapi
 * /admin/banks/{id}:
 *   put:
 *     summary: Perbarui Data Rekening Master Platform
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account_holder_name:
 *                 type: string
 *                 example: "PT GreenPay Official"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         $ref: '#/components/responses/200OK'
 *
 *   delete:
 *     summary: Hapus Rekening Master Platform
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         $ref: '#/components/responses/200OK'
 */

/**
 * @openapi
 * /admin/topups/pending:
 *   get:
 *     summary: Ambil Daftar Antrean Permohonan Top Up Manual Pengguna
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         $ref: '#/components/responses/200OK'
 */

/**
 * @openapi
 * /admin/topups/{id}/approve:
 *   patch:
 *     summary: Setujui Permohonan Top Up (Kreditkan Saldo ke Pengguna)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Top up disetujui, saldo dikreditkan
 */

/**
 * @openapi
 * /admin/topups/{id}/cancel:
 *   patch:
 *     summary: Batalkan Permohonan Top Up Manual
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permohonan top up dibatalkan
 */

/**
 * @openapi
 * /admin/withdrawals/pending:
 *   get:
 *     summary: Ambil Antrean Penarikan Dana (Withdrawal) Tertahan
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         $ref: '#/components/responses/200OK'
 */

/**
 * @openapi
 * /admin/withdrawals/{id}/approve:
 *   patch:
 *     summary: Setujui Kliring Penarikan Dana (Dana Resmi Keluar Sistem)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kliring disetujui
 */

/**
 * @openapi
 * /admin/withdrawals/{id}/reject:
 *   patch:
 *     summary: Tolak Penarikan Dana (Kembalikan Saldo ke Dompet Pengguna)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rejected_reason]
 *             properties:
 *               rejected_reason:
 *                 type: string
 *                 example: "Nomor rekening tujuan tidak valid"
 *     responses:
 *       200:
 *         description: Penarikan ditolak dan saldo direfund
 */

/**
 * @openapi
 * /admin/financial-report:
 *   get:
 *     summary: Tarik Agregasi Laporan Neraca Keuangan Platform
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [daily, monthly]
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           example: 8
 *     responses:
 *       200:
 *         description: Laporan neraca keuangan berhasil ditarik
 */

/**
 * @openapi
 * /admin/transfers/pending:
 *   get:
 *     summary: Ambil Daftar Transfer Bernilai Besar (High-Value AML Pending)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         $ref: '#/components/responses/200OK'
 */

/**
 * @openapi
 * /admin/transfers/{id}/approve:
 *   patch:
 *     summary: Setujui Transfer High-Value (Kreditkan Dana ke Penerima)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transfer bernilai besar disetujui
 */

/**
 * @openapi
 * /admin/transfers/{id}/reject:
 *   patch:
 *     summary: Tolak Transfer High-Value (Pulangkan Dana ke Pengirim)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rejected_reason:
 *                 type: string
 *                 example: "Indikasi transaksi mencurigakan (AML)"
 *     responses:
 *       200:
 *         description: Transfer ditolak dan dana dikembalikan ke pengirim
 */
