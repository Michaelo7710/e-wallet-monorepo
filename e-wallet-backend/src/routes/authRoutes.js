const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Lintas Autentikasi Dasar & Verifikasi
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Lintas Pemulihan Akses Kredensial
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Lintas Otentikasi Tahap Lanjutan (Pre-Auth 2FA)
router.post('/2fa/verify-login', authController.verify2FALogin);

// Lintas Protokol Keamanan Lapis Baja (2FA)
router.use(protect);
router.post('/2fa/generate', authController.generate2FA);
router.post('/2fa/verify', authController.verify2FA);

module.exports = router;