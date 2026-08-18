const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// 1. Lapis Pertama: Memastikan Pengguna Terotentikasi (Punya Token Valid)
exports.protect = catchAsync(async (req, res, next) => {
  // a. Mengekstrak Token dari Header (Format Standar Industri: 'Bearer <token>')
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Jika tidak ada token, langsung tolak di pintu depan
  if (!token) {
    return next(
      new AppError('Anda belum login. Silakan login untuk mendapatkan akses.', StatusCodes.UNAUTHORIZED, 'INVALID_TOKEN')
    );
  }

  // 1. Verifikasi Kriptografi Access Token (Murni di Memori Node.js - 0x Query DB!)
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Access Token Anda telah kedaluwarsa. Silakan lakukan refresh token.', StatusCodes.UNAUTHORIZED));
    }
    return next(new AppError('Token tidak valid.', StatusCodes.UNAUTHORIZED, 'INVALID_TOKEN'));
  }

  // 2. Cek apakah user pemilik token masih eksis di database
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('Pengguna pemilik token ini tidak lagi terdaftar.', StatusCodes.UNAUTHORIZED));
  }

  // d. Validasi Keamanan Sistem (Anti-Fraud Check)
  if (currentUser.is_suspended) {
    return next(
      new AppError('Akun Anda sedang ditangguhkan. Silakan hubungi tim Admin.', StatusCodes.FORBIDDEN)
    );
  }

  // e. Lulus Ujian: Sisipkan data user ke dalam request agar bisa dipakai oleh Controller
  req.user = currentUser;
  next();
});

// 2. Lapis Kedua: Memastikan Hierarki/Pangkat (Role-Based Access Control)
// Fungsi ini menggunakan teknik "Closure" di JavaScript
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user sudah didapatkan dari middleware 'protect' yang wajib dijalankan tepat sebelum ini
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Anda tidak memiliki otoritas untuk mengakses rute ini.', StatusCodes.FORBIDDEN)
      );
    }
    
    // Jika rolenya sesuai (misal: 'admin'), silakan masuk
    next();
  };
};