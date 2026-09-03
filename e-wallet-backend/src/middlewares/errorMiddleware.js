const { StatusCodes, ReasonPhrases } = require('http-status-codes');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ========================================================
// HELPER TRANSFORMASI ERROR MONGOOSE & SYNTAX
// ========================================================
const handleCastErrorDB = (err) => {
  const message = `Format data tidak valid untuk ${err.path}: ${err.value}.`;
  return new AppError(message, StatusCodes.BAD_REQUEST, 'INVALID_DATA_FORMAT');
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'Nilai';
  const message = `Data duplikat terdeteksi: ${value}. Silakan gunakan data lain.`;
  return new AppError(message, StatusCodes.BAD_REQUEST, 'DUPLICATE_RESOURCE');
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Data tidak valid. ${errors.join('. ')}`;
  return new AppError(message, StatusCodes.BAD_REQUEST, 'VALIDATION_ERROR');
};

const handleJSONSyntaxError = () => {
  return new AppError(
    'Struktur payload JSON yang dikirimkan cacat atau mengandung koma gantung (trailing comma). Periksa kembali sintaksis JSON Anda.',
    StatusCodes.BAD_REQUEST,
    'MALFORMED_JSON_PAYLOAD'
  );
};

// ========================================================
// RESPON ERROR UNTUK ENVIRONMENT BERBEDA (DENGAN MOBILE SUPPORT & CORRELATION ID)
// ========================================================
const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error_code: err.errorCode || 'GENERAL_ERROR',
    correlation_id: req.correlationId || 'N/A',
    message: err.message,
    timestamp: new Date().toISOString(),
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  const timestamp = new Date().toISOString();
  const correlationId = req.correlationId || 'N/A';

  // Operational, trusted error: Kirim pesan ke klien
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      error_code: err.errorCode || 'OPERATIONAL_ERROR',
      correlation_id: correlationId,
      message: err.message,
      timestamp,
    });
  } else {
    // Programming or other unknown error: Jangan bocorkan detail internal ke klien
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      error_code: err.errorCode || 'INTERNAL_SERVER_ERROR',
      correlation_id: correlationId,
      message: ReasonPhrases.INTERNAL_SERVER_ERROR,
      timestamp,
    });
  }
};

// ========================================================
// MIDDLEWARE ERROR UTAMA (ALGOJO GLOBAL)
// ========================================================
module.exports = (err, req, res, next) => {
  // 1. Amankan status code & metadata awal
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.code = err.code;
  error.errorCode = err.errorCode;
  error.stack = err.stack;
  error.isOperational = err.isOperational;

  // 2. INTERSEPSE FORENSIK GLOBAL (Bekerja di Dev & Prod demi konsistensi Klien)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = handleJSONSyntaxError();
  }
  if (error.name === 'JsonWebTokenError') {
    error = new AppError('Token tidak valid. Silakan login kembali.', StatusCodes.UNAUTHORIZED, 'INVALID_TOKEN');
  }
  if (error.name === 'TokenExpiredError') {
    error = new AppError('Sesi Anda telah berakhir. Silakan login kembali.', StatusCodes.UNAUTHORIZED, 'TOKEN_EXPIRED');
  }

  // Set default status jika tidak tersentuh transformasi
  error.statusCode = error.statusCode || err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  error.status = error.status || err.status || 'error';

  // 3. LOGGING TERSTRUKTUR DENGAN CORRELATION ID
  const logPayload = {
    correlationId: req.correlationId || 'N/A',
    errorCode: error.errorCode || 'OPERATIONAL_ERROR',
    statusCode: error.statusCode,
    method: req.method,
    url: req.originalUrl || req.url,
    message: error.message,
    stack: error.stack,
  };

  if (error.statusCode >= 500) {
    logger.error(logPayload, `[API ERROR] ${error.message}`);
  } else {
    logger.warn(logPayload, `[API WARN] ${error.message}`);
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);

    sendErrorProd(error, req, res);
  }
};