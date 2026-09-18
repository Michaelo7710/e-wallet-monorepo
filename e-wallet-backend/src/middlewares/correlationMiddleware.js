/**
 * GreenPay Correlation ID & Distributed Tracing Middleware
 * 
 * Bertanggung jawab untuk:
 * 1. Mendeteksi atau men-generate Correlation ID (UUID v4) unik per request
 * 2. Menyematkan 'X-Correlation-ID' pada header response
 * 3. Menginjeksi child logger 'req.log' dengan konteks correlationId
 * 4. Mengukur latency HTTP (ms) dan mencatat access log terstruktur
 */

const crypto = require('crypto');
const logger = require('../utils/logger');

const SENSITIVE_KEYS_REGEX = /^(pass(word)?|pin|otp|token|secret|id_card_photo|idcardphoto|nik|old_?pass(word)?|new_?pass(word)?|confirm_?new_?pass(word)?|old_?pin|new_?pin|confirm_?new_?pin|pre_?auth_?token|refresh_?token|two_?factor_?secret)$/i;

/**
 * Sanitasi defensif lapis pertama untuk payload body sebelum diserialisasi ke log
 */
function sanitizeRequestBody(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeRequestBody);

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS_REGEX.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeRequestBody(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const correlationMiddleware = (req, res, next) => {
  // 1. Ambil Correlation ID dari upstream/klien jika ada, atau buat UUID baru
  const incomingId = req.headers['x-correlation-id'] || req.headers['x-request-id'];
  const correlationId = (typeof incomingId === 'string' && incomingId.trim())
    ? incomingId.trim()
    : crypto.randomUUID();

  // 2. Lampirkan ke objek request untuk diakses oleh controller & error middleware
  req.correlationId = correlationId;

  // 3. Sematkan ke header response keluar
  res.setHeader('X-Correlation-ID', correlationId);

  // 4. Buat child logger yang otomatis menyertakan correlationId pada setiap log
  req.log = logger.child({ correlationId });

  // 5. Catat waktu mulai request untuk pengukuran latency
  const startTime = Date.now();

  // Catat log HTTP Request Masuk
  req.log.info({
    event: 'http_request_start',
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.socket?.remoteAddress,
    userAgent: req.headers['user-agent'],
  }, `--> ${req.method} ${req.originalUrl || req.url}`);

  // Catat log HTTP Response Selesai (saat socket selesai mengirim data ke klien)
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const logData = {
      event: 'http_request_complete',
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTimeMs: durationMs,
      // Sertakan body request dengan sanitasi ganda (Sanitizer lokal + Pino Redaction)
      ...(req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0 && { 
        body: sanitizeRequestBody(req.body) 
      }),
    };

    const message = `<-- ${req.method} ${req.originalUrl || req.url} ${res.statusCode} [${durationMs}ms]`;

    if (res.statusCode >= 500) {
      req.log.error(logData, message);
    } else if (res.statusCode >= 400) {
      req.log.warn(logData, message);
    } else {
      req.log.info(logData, message);
    }
  });

  next();
};

module.exports = correlationMiddleware;
