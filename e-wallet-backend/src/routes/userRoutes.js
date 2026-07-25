const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// ========================================================
// PROTEKSI GLOBAL MIDDLEWARE
// ========================================================
// Seluruh rute di bawah ini wajib membawa Bearer Token JWT yang sah di dalam Header
router.use(protect);

// Sirkuit Navigasi Dasbor & Kredensial Umum
router.get('/me', userController.getMe);
router.post('/setup-pin', userController.setupPin);
router.patch('/update-password', userController.updatePassword);

// Sirkuit Modifikasi Sensitif Sesuai Alur Diagram Keamanan Berlapis
router.patch('/update-email', userController.updateEmailSecurely);
router.patch('/update-pin', userController.updatePinSecurely);

// Jalur Kliring Akun Premium Portofolio (KYC)
router.patch('/update-kyc', userController.updateKYC);

router.get('/contacts', userController.getSavedContacts);

module.exports = router;