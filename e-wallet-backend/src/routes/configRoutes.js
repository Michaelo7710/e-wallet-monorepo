const express = require('express');
const router = express.Router();

router.get('/feature-flags', (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      p2p_transfer: { enabled: true },
      topup_midtrans: { enabled: true },
      bank_withdrawal: { enabled: true },
      kyc_submission: { enabled: true },
      biometric_login: { enabled: true },
    },
  });
});

module.exports = router;
