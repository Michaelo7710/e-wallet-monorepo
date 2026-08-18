/**
 * @openapi
 * tags:
 *   name: Payments
 *   description: Endpoints Transaksi Saldo, Midtrans Gateway, Transfer P2P & Penarikan Dana
 */

/**
 * @openapi
 * /payments/midtrans-webhook:
 *   post:
 *     summary: Webhook Notifikasi Transaksi Otomatis dari Midtrans
 *     tags: [Payments]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, status_code, gross_amount, signature_key, transaction_status]
 *             properties:
 *               order_id: { type: string, example: "GP-TP-20260818-A1B2C3D4" }
 *               status_code: { type: string, example: "200" }
 *               gross_amount: { type: string, example: "100000.00" }
 *               signature_key: { type: string, example: "abcdef1234567890..." }
 *               transaction_status: { type: string, example: "settlement" }
 *     responses:
 *       200:
 *         description: Webhook berhasil diproses dan saldo pengguna telah dikreditkan
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 */

/**
 * @openapi
 * /payments/topup/initiate:
 *   post:
 *     summary: Inisialisasi Permintaan Top Up (Penerbitan Snap Token Midtrans)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number, example: 50000, description: "Minimal top up Rp 10.000" }
 *     responses:
 *       201:
 *         description: Snap Token berhasil diterbitkan untuk pembayaran di mobile
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 */

/**
 * @openapi
 * /payments/transfer:
 *   post:
 *     summary: Transfer Saldo Antar Pengguna GreenPay (P2P)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiver_phone_number, amount, pin]
 *             properties:
 *               receiver_phone_number: { type: string, example: "089876543210" }
 *               amount: { type: number, example: 250000 }
 *               pin: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Transfer berhasil dieksekusi atau tertahan jika bernilai besar (>= 10 Juta)
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 */

/**
 * @openapi
 * /payments/withdrawal/request:
 *   post:
 *     summary: Permintaan Penarikan Saldo Keluar Ekosistem (Transfer Bank)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bank_name, account_number, account_name, amount]
 *             properties:
 *               bank_name: { type: string, example: "BCA" }
 *               account_number: { type: string, example: "8830998811" }
 *               account_name: { type: string, example: "Michael S" }
 *               amount: { type: number, example: 100000, description: "Minimal penarikan Rp 50.000" }
 *     responses:
 *       200:
 *         description: Penarikan saldo berhasil diproses
 *       400:
 *         $ref: '#/components/responses/400BadRequest'
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 */

/**
 * @openapi
 * /payments/history:
 *   get:
 *     summary: Ambil Riwayat Mutasi Buku Besar (Inflow / Outflow)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [topup, transfer, withdrawal] }
 *     responses:
 *       200:
 *         description: Riwayat transaksi berhasil diagregasi
 *       401:
 *         $ref: '#/components/responses/401Unauthorized'
 */