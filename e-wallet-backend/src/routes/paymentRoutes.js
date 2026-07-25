const express = require('express');
const paymentController = require('../controllers/paymentController'); 
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Webhook Midtrans: WAJIB Terbuka Umum karena diketuk asinkronus oleh server luar Midtrans
router.post('/midtrans-webhook', paymentController.handleMidtransWebhook);

// Sirkuit Transaksi Pengguna: Wajib terkunci aman
router.use(protect);
router.post('/topup/initiate', paymentController.initiateTopUp);
router.post('/withdrawal/request', paymentController.requestWithdrawal);
router.post('/transfer', paymentController.transferP2P);
router.get('/history', paymentController.getTransactionHistory);

module.exports = router;