const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');

// Direktori penyimpanan file upload KTP
const uploadDir = path.join(__dirname, '../../uploads/kyc');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Disk Storage Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const userId = req.user?._id ? String(req.user._id) : 'anon';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `ktp-${userId}-${uniqueSuffix}${ext}`);
  },
});

// Filter Format File: Hanya terima file gambar
const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(
      new AppError('Format berkas tidak valid. Harap unggah foto identitas berformat JPEG/PNG.', StatusCodes.BAD_REQUEST),
      false
    );
  }
};

const uploadKycPhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
  fileFilter,
});

module.exports = {
  uploadKycPhoto,
};
