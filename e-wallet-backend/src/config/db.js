const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // [CLEAN CODE DYNAMIC OPTIONS] Opsi adaptif menyesuaikan beban environment
    const dev = 'development' || 'production' ;
    const connectionOptions = {
      // Jika di local development, paksa matikan retryWrites agar database standalone tidak crash
      ...(process.env.NODE_ENV === dev && { retryWrites: false })
    };
    // Mongoose 6+ tidak lagi memerlukan opsi useNewUrlParser & useUnifiedTopology

    // Dinamis: Ambil string database dari DATABASE_URL atau MONGO_URI
    const dbUri = process.env.DATABASE_URL || process.env.MONGO_URI || process.env.MONGODB_URI;
    const conn = await mongoose.connect(dbUri , connectionOptions);
    
    console.log(`✅ MongoDB Terhubung: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error Koneksi MongoDB: ${error.message}`);
    // Matikan proses Node.js jika database gagal terhubung (Fatal Error)
    process.exit(1); 
  }
};

module.exports = connectDB;