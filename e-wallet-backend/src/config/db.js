const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // [CLEAN CODE DYNAMIC OPTIONS] Opsi adaptif menyesuaikan beban environment
    const connectionOptions = {
      // Jika di local development, paksa matikan retryWrites agar database standalone tidak crash
      ...(process.env.NODE_ENV === 'development' && { retryWrites: false })
    };
    // Mongoose 6+ tidak lagi memerlukan opsi useNewUrlParser & useUnifiedTopology
    const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
    
    console.log(`✅ MongoDB Terhubung: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error Koneksi MongoDB: ${error.message}`);
    // Matikan proses Node.js jika database gagal terhubung (Fatal Error)
    process.exit(1); 
  }
};

module.exports = connectDB;