class AppError extends Error {
  constructor(message, statusCode, errorCode = 'OPERATIONAL_ERROR') {
    super(message); // Memanggil constructor dari class Error bawaan Node.js

    this.statusCode = statusCode;
    // Jika awalan 4 (misal 400, 404) statusnya 'fail', selain itu 'error'
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    // Menandai ini sebagai error yang kita prediksi (bukan bug sistem)
    this.isOperational = true;

    // Kode unik untuk Axios Interceptor React Native
    this.errorCode = errorCode; 
    
    // Merekam stack trace (jalur error) agar mudah di-debug
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;