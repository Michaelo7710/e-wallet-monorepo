const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// ========================================================
// BENTENG KEAMANAN SAKRAL (ADMIN ONLY)t
// ========================================================
router.use(protect);            // 1. Wajib bawa Bearer Access Token sah
router.use(restrictTo('admin')); // 2. Wajib ber-role 'admin'

// --------------------------------------------------------
// 1. SIRKUIT MANAJEMEN REKENING MASTER (ADMIN BANK)
// --------------------------------------------------------
router.post('/banks', adminController.createAdminBank);
router.get('/banks', adminController.getAllAdminBanks);
router.put('/banks/:id', adminController.updateAdminBank);
router.delete('/banks/:id', adminController.deleteAdminBank);

// --------------------------------------------------------
// 2. SIRKUIT MAKER-CHECKER TOP UP MANUAL USER
// --------------------------------------------------------
router.get('/topups/pending', adminController.getPendingTopUps);
router.patch('/topups/:id/approve', adminController.approveTopUp);
router.patch('/topups/:id/cancel', adminController.cancelTopUp);
router.delete('/topups/:id', adminController.deleteTopUpRecord);

// --------------------------------------------------------
// 3. SIRKUIT MANAJEMEN KLIRING DANA KELUAR (WITHDRAWAL)
// --------------------------------------------------------
router.get('/withdrawals/pending', adminController.getPendingWithdrawals);
router.patch('/withdrawals/:id/approve', adminController.approveWithdrawal);
router.patch('/withdrawals/:id/reject', adminController.rejectWithdrawal);

// --------------------------------------------------------
// 4. SIRKUIT DASHBOARD AGREGASI NERACA KEUANGAN & STATS
// --------------------------------------------------------
router.get('/stats', adminController.getAdminStats);
router.get('/financial-report', adminController.getFinancialReport);

// --------------------------------------------------------
// 5. SIRKUIT KLIRING TRANSFER NOMINAL BESAR (HIGH-VALUE P2P)
// --------------------------------------------------------
router.get('/transfers/pending', adminController.getPendingTransfers);
router.patch('/transfers/:id/approve', adminController.approveTransfer);
router.patch('/transfers/:id/reject', adminController.rejectTransfer);

// --------------------------------------------------------
// 6. SIRKUIT ANTI-FRAUD MANAJEMEN PENGGUNA (USER GOVERNANCE)
// --------------------------------------------------------
router.get('/users', adminController.getAdminUsers);
router.patch('/users/:id/freeze', adminController.freezeUser);
router.patch('/users/:id/unfreeze', adminController.unfreezeUser);

// --------------------------------------------------------
// 7. SIRKUIT AUDIT TRAIL ADMINISTRATIF (COMPLIANCE)
// --------------------------------------------------------
router.get('/audit-logs', adminController.getAdminAuditLogs);

module.exports = router;