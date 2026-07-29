// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     // [CLEAN CODE DYNAMIC OPTIONS] Opsi adaptif menyesuaikan beban environment
//     const dev = 'development' || 'production' ;
//     const connectionOptions = {
//       // Jika di local development, paksa matikan retryWrites agar database standalone tidak crash
//       ...(process.env.NODE_ENV === dev && { retryWrites: false })
//     };
//     // Mongoose 6+ tidak lagi memerlukan opsi useNewUrlParser & useUnifiedTopology

//     // Dinamis: Ambil string database dari DATABASE_URL atau MONGO_URI
//     const dbUri = process.env.DATABASE_URL || process.env.MONGO_URI || process.env.MONGODB_URI;
//     const conn = await mongoose.connect(dbUri , connectionOptions);
    
//     console.log(`✅ MongoDB Terhubung: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`❌ Error Koneksi MongoDB: ${error.message}`);
//     // Matikan proses Node.js jika database gagal terhubung (Fatal Error)
//     throw error;
//   }
// };

// module.exports = connectDB;

const mongoose = require('mongoose');

const connectDB = async () => {
  // 1. Connection Caching: Cegah koneksi ganda pada Serverless Container
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  // 2. Ambil string URI secara dinamis
  const dbUri = process.env.DATABASE_URL || process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!dbUri) {
    throw new Error('❌ DATABASE_URL / MONGO_URI tidak ditemukan pada Environment Variables!');
  }

  // 3. Opsi adaptif menyesuaikan lingkungan
  const connectionOptions = {
    serverSelectionTimeoutMS: 5000, // Timeout 5 detik jika DB tidak merespon
    ...(process.env.NODE_ENV === 'development' && { retryWrites: false }),
  };

  try {
    const conn = await mongoose.connect(dbUri, connectionOptions);
    console.log(`✅ MongoDB Terhubung: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error Koneksi MongoDB: ${error.message}`);
    // Lempar error agar ditangkap oleh Global Error Handler (Jangan gunakan process.exit di serverless!)
    throw error;
  }
};

module.exports = connectDB;