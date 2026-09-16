const express = require('express');
const paymentController = require('../controllers/paymentController'); 
const { protect } = require('../middlewares/authMiddleware');
const { idempotencyGuard } = require('../middlewares/idempotencyMiddleware');

const router = express.Router();

// Webhook Midtrans: WAJIB Terbuka Umum karena diketuk asinkronus oleh server luar Midtrans
router.post('/midtrans-webhook', paymentController.handleMidtransWebhook);
router.post('/midtrans-notification', paymentController.handleMidtransWebhook);

// Sirkuit Transaksi Pengguna: Wajib terkunci aman
router.use(protect);
router.post('/topup/initiate', paymentController.initiateTopUp);
router.post('/withdrawal/request', idempotencyGuard, paymentController.requestWithdrawal);
router.post('/transfer', idempotencyGuard, paymentController.transferP2P);
router.get('/history', paymentController.getTransactionHistory);

module.exports = router;