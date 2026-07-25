const jwt = require('jsonwebtoken');

// 1. PABRIK ACCESS TOKEN (Masa Aktif Singkat: 15 Menit)
exports.signAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

// 2. PABRIK REFRESH TOKEN (Masa Aktif Panjang: 7 Hari)
exports.signRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};