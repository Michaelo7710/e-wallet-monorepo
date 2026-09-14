// server.js
// 1. Fail-Fast Environment Validation di Baris Pertama (Sebelum app & db diimpor)
const { validateEnv } = require('./src/config/envValidator');
const ENV = validateEnv();

const app = require('./app');
const connectDB = require('./src/config/db');

const PORT = ENV.PORT;

// 2. Jalankan Koneksi Database & Server Listener
let server;

if (ENV.NODE_ENV !== 'test') {
  // Buka koneksi ke MongoDB Lokal/Cloud HANYA jika tidak sedang testing
  connectDB();

  server = app.listen(PORT, () => {
    console.log(`🚀 Server GreenPay berjalan aman di mode ${ENV.NODE_ENV} pada port ${PORT}`);
  });
}

// 3. Menangani Unhandled Promise Rejections (Penanganan Darurat)
process.on('unhandledRejection', (err) => {
  console.log('💥 UNHANDLED REJECTION! Mematikan server...');
  console.log(err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

module.exports = app;