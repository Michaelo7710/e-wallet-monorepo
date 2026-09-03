// app.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const { StatusCodes } = require('http-status-codes');

// Pustaka Keamanan & Observability Enterprise
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

const correlationMiddleware = require('./src/middlewares/correlationMiddleware');
const connectDB = require('./src/config/db');
const { specs } = require('./src/config/swagger');

const AppError = require('./src/utils/AppError');
const globalErrorHandler = require('./src/middlewares/errorMiddleware');
const authRoutes = require('./src/routes/authRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();

// ==========================================
// LAPISAN 0: OBSERVABILITY & DISTRIBUTED TRACING (BARIS PERTAMA)
// ==========================================
// 🚀 Pasang di baris PERTAMA middleware Express untuk menjamin seluruh request memiliki Correlation ID & Structured Logging
app.use(correlationMiddleware);

// ==========================================
// LAPISAN 1: KEAMANAN GLOBAL & CORS
// ==========================================
// 🛡️ Buka Content Security Policy (CSP) agar peramban diizinkan memuat CDN Swagger UI
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

const corsOptions = {
  origin: process.env.NODE_ENV === 'development' ? '*' : process.env.CLIENT_URL || '*',
  credentials: true,
};
app.use(cors(corsOptions));

// ==========================================
// LAPISAN 2: PARSER, SANITASI & DATABASE GUARD
// ==========================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize());

// 🍃 Middleware Pemicu Koneksi MongoDB Atlas (Safe Serverless Connection Pool)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// ==========================================
// LAPISAN 3: RATE LIMITING
// ==========================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: {
    status: 'error',
    message: 'Terlalu banyak permintaan dari IP Anda, silakan coba lagi setelah 15 menit.',
  },
});
app.use('/api', apiLimiter);

// ==========================================
// LAPISAN 4: ROUTING (JALUR LALU LINTAS)
// ==========================================
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Selamat datang di API Dompet Digital GreenPay',
    status: 'Running',
    documentation: '/api-docs',
  });
});

// 📖 1. Endpoint Spesifikasi JSON OpenAPI
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// 📖 2. Render Interactive Swagger UI (Native CDN Rendering - Anti-White Screen)
app.get('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GreenPay API Documentation</title>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.min.css" />
      <style>
        html { box-sizing: border-box; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
        .swagger-ui .topbar { display: none; } /* Sembunyikan topbar bawaan */
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-bundle.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-standalone-preset.js"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/api-docs.json',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
            layout: "StandaloneLayout"
          });
        };
      </script>
    </body>
    </html>
  `);
});

// Endpoint Utama API v1
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

module.exports = app;