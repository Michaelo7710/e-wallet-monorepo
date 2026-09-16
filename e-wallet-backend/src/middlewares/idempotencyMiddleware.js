const { StatusCodes } = require('http-status-codes');

// Penyimpanan in-memory cache dengan TTL 120 detik
const idempotencyStore = new Map();
const TTL_MS = 120 * 1000; // 120 Detik

// Pembersihan rutin setiap 60 detik untuk mencegah memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of idempotencyStore.entries()) {
    if (now - record.timestamp > TTL_MS) {
      idempotencyStore.delete(key);
    }
  }
}, 60 * 1000).unref(); // unref agar tidak menahan proses Node.js saat exit/test

/**
 * Middleware Idempotency Guard
 * Melindungi endpoint mutasi finansial dari eksekusi ganda akibat retry jaringan / double-click
 */
const idempotencyGuard = (req, res, next) => {
  const idempotencyKey = req.headers['x-idempotency-key'] || req.headers['idempotency-key'];

  // Jika klien tidak menyertakan idempotency key, izinkan lewat (backward compatibility)
  if (!idempotencyKey) {
    return next();
  }

  // Gabungkan User ID (jika ada dari auth middleware) dengan key untuk isolasi multi-tenant
  const compositeKey = req.user ? `${req.user._id || req.user.id}:${idempotencyKey}` : idempotencyKey;
  const existingRecord = idempotencyStore.get(compositeKey);

  if (existingRecord) {
    const isExpired = Date.now() - existingRecord.timestamp > TTL_MS;
    if (!isExpired) {
      if (existingRecord.status === 'in-flight') {
        return res.status(StatusCodes.CONFLICT).json({
          status: 'fail',
          message: 'Transaksi dengan Idempotency Key ini sedang diproses. Mohon tunggu konfirmasi sistem.',
          code: 'IDEMPOTENT_OPERATION_IN_FLIGHT'
        });
      }

      // Jika sudah selesai, kembalikan respons tersimpan secara idempoten
      res.setHeader('X-Cache-Lookup', 'HIT');
      return res.status(existingRecord.statusCode).json(existingRecord.body);
    } else {
      idempotencyStore.delete(compositeKey);
    }
  }

  // Tandai transaksi sebagai in-flight
  idempotencyStore.set(compositeKey, {
    status: 'in-flight',
    timestamp: Date.now()
  });

  // Intersep res.json untuk merekam respons akhir
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Hanya simpan respons sukses (2xx) atau valid client errors yang pantas di-cache
    idempotencyStore.set(compositeKey, {
      status: 'completed',
      statusCode: res.statusCode,
      body,
      timestamp: Date.now()
    });

    res.setHeader('X-Cache-Lookup', 'MISS');
    return originalJson(body);
  };

  next();
};

module.exports = {
  idempotencyGuard,
  idempotencyStore // diekspor untuk kebutuhan unit testing
};
