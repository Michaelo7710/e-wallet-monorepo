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
      // Sertakan body request jika ada (Pino Redaction otomatis menyensor field sensitif/PII)
      ...(req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0 && { body: req.body }),
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
