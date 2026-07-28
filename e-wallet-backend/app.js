const connectDB = require('./src/config/db');

// Otomatis hubungkan ke MongoDB Atlas jika dijalankan di Vercel/Production
if (process.env.NODE_ENV === 'production') {
  connectDB();
}

// app.js
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');

// Pustaka Keamanan Enterprise
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const AppError = require('./src/utils/AppError');
const globalErrorHandler = require('./src/middlewares/errorMiddleware');
const authRoutes = require('./src/routes/authRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

// ==========================================
// LAPISAN 1: KEAMANAN GLOBAL & CORS
// ==========================================
app.use(helmet());

const corsOptions = {
  origin: process.env.NODE_ENV === 'development' ? '*' : process.env.CLIENT_URL,
  credentials: true,
};
app.use(cors(corsOptions));

// ==========================================
// LAPISAN 2: PARSER & SANITASI DATA
// ==========================================
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());

// ==========================================
// LAPISAN 3: LOGGING & RATE LIMITING
// ==========================================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: {
    status: 'error',
    message: 'Terlalu banyak permintaan dari IP Anda, silakan coba lagi setelah 15 menit.'
  }
});
app.use('/api', apiLimiter);

// ==========================================
// LAPISAN 4: ROUTING (JALUR LALU LINTAS)
// ==========================================
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Selamat datang di API Dompet Digital',
    status: 'Running'
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/users', userRoutes);

// Menangani Rute Hantu (404)
app.use((req, res, next) => {
  next(new AppError(`Rute ${req.originalUrl} tidak ditemukan pada server ini!`, StatusCodes.NOT_FOUND));
});

// ==========================================
// LAPISAN 5: ALGOJO ERROR GLOBAL
// ==========================================
app.use(globalErrorHandler);

module.exports = app; // 👈 Export instansi app murni untuk Supertest