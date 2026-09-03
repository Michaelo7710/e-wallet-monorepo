/**
 * GreenPay Backend Environment Schema Validator (Fail-Fast)
 * 
 * Modul ini memastikan seluruh environment variable yang dibutuhkan oleh server
 * terdefinisi dengan tipe data dan format yang valid sebelum aplikasi mulai mengikat
 * port atau membuka koneksi database.
 */

const path = require('path');
const dotenv = require('dotenv');

// Muat .env secara internal (prioritas path absolut root backend)
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });
dotenv.config();

let cachedEnv = null;

/**
 * Sensor/mask nilai sensitif agar aman saat dicetak ke log diagnostik.
 * @param {string} val 
 * @param {number} visibleStart 
 * @param {number} visibleEnd 
 * @returns {string}
 */
function maskSecret(val, visibleStart = 4, visibleEnd = 0) {
  if (!val) return '[NOT_SET]';
  const s = String(val);
  if (s.length <= visibleStart + visibleEnd) return '***';
  const start = s.substring(0, visibleStart);
  const end = visibleEnd > 0 ? s.slice(-visibleEnd) : '';
  const maskedLength = Math.max(4, Math.min(20, s.length - visibleStart - visibleEnd));
  return `${start}${'*'.repeat(maskedLength)}${end}`;
}

/**
 * Sensor kredensial password dari URI koneksi database (mongodb://user:pass@host)
 * @param {string} uri 
 * @returns {string}
 */
function sanitizeDatabaseUri(uri) {
  if (!uri) return '[NOT_SET]';
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
}

/**
 * Jalankan validasi skema environment variable secara menyeluruh (Fail-Fast).
 * @param {object} options 
 * @param {boolean} [options.exitOnError=true] - Jika true, matikan proses jika ada error.
 * @param {boolean} [options.forceReload=false] - Jika true, paksa validasi ulang tanpa cache.
 * @param {object} [options.customEnv=null] - Lingkungan alternatif untuk pengujian.
 * @returns {Readonly<object>} Objek ENV yang telah divalidasi dan dibekukan.
 */
function validateEnv(options = {}) {
  const exitOnError = options.exitOnError !== false;
  const forceReload = options.forceReload === true;
  const envSource = options.customEnv || process.env;

  if (cachedEnv && !forceReload && !options.customEnv) {
    return cachedEnv;
  }

  const errors = [];

  // 1. NODE_ENV: enum ['development', 'production', 'test'] (default: 'development')
  const nodeEnv = (envSource.NODE_ENV || 'development').trim();
  const allowedNodeEnvs = ['development', 'production', 'test'];
  if (!allowedNodeEnvs.includes(nodeEnv)) {
    errors.push(
      `NODE_ENV: Nilai tidak valid ("${nodeEnv}"). Pilihan yang diizinkan: ${allowedNodeEnvs.join(', ')}`
    );
  }

  // 2. PORT: number, positive integer (default: 3000)
  const rawPort = envSource.PORT;
  let port = 3000;
  if (rawPort !== undefined && rawPort !== '') {
    const parsedPort = Number(rawPort);
    if (!Number.isInteger(parsedPort) || parsedPort <= 0 || parsedPort > 65535) {
      errors.push(`PORT: Harus berupa bilangan bulat positif antara 1 dan 65535. Diterima: "${rawPort}"`);
    } else {
      port = parsedPort;
    }
  }

  // 3. DATABASE_URL (atau MONGO_URI / MONGODB_URI): string URL yang valid, wajib ada
  const rawDbUrl = envSource.DATABASE_URL || envSource.MONGO_URI || envSource.MONGODB_URI;
  const databaseUrl = rawDbUrl ? String(rawDbUrl).trim() : '';
  if (!databaseUrl) {
    errors.push('DATABASE_URL (atau MONGO_URI / MONGODB_URI): Variabel wajib diisi.');
  } else {
    const isMongoProtocol = /^(mongodb|mongodb\+srv):\/\//i.test(databaseUrl);
    let isValidUrl = false;
    try {
      new URL(databaseUrl);
      isValidUrl = true;
    } catch {
      // Abaikan error URL parser untuk protokol non-standar
    }
    if (!isMongoProtocol && !isValidUrl) {
      errors.push(
        `DATABASE_URL: Format URL tidak valid. Harus berupa URL database yang sah (misal: mongodb:// atau mongodb+srv://). Diterima: "${databaseUrl}"`
      );
    }
  }

  // 4. JWT_SECRET: string, minimal 16 karakter (rekomendasi 32)
  const jwtSecret = envSource.JWT_SECRET ? String(envSource.JWT_SECRET).trim() : '';
  if (!jwtSecret) {
    errors.push('JWT_SECRET: Variabel wajib diisi.');
  } else if (jwtSecret.length < 16) {
    errors.push(
      `JWT_SECRET: Panjang rahasia minimal 16 karakter (rekomendasi 32). Panjang saat ini: ${jwtSecret.length}`
    );
  }

  // 5. JWT_EXPIRES_IN: string (misal: '15m') (default: '15m')
  const jwtExpiresIn = (envSource.JWT_EXPIRES_IN || '15m').trim();
  if (!jwtExpiresIn) {
    errors.push('JWT_EXPIRES_IN: Wajib berupa string non-kosong (misal: "15m").');
  }

  // 6. JWT_REFRESH_SECRET: string, minimal 16 karakter, wajib ada
  const jwtRefreshSecret = envSource.JWT_REFRESH_SECRET ? String(envSource.JWT_REFRESH_SECRET).trim() : '';
  if (!jwtRefreshSecret) {
    errors.push('JWT_REFRESH_SECRET: Variabel wajib diisi.');
  } else if (jwtRefreshSecret.length < 16) {
    errors.push(
      `JWT_REFRESH_SECRET: Panjang minimal 16 karakter. Panjang saat ini: ${jwtRefreshSecret.length}`
    );
  }

  // 7. JWT_REFRESH_EXPIRES_IN: string (misal: '7d') (default: '7d')
  const jwtRefreshExpiresIn = (envSource.JWT_REFRESH_EXPIRES_IN || '7d').trim();
  if (!jwtRefreshExpiresIn) {
    errors.push('JWT_REFRESH_EXPIRES_IN: Wajib berupa string non-kosong (misal: "7d").');
  }

  // 8. JWT_PRE_AUTH_SECRET: string, wajib ada untuk isolasi tiket 2FA
  const jwtPreAuthSecret = envSource.JWT_PRE_AUTH_SECRET ? String(envSource.JWT_PRE_AUTH_SECRET).trim() : '';
  if (!jwtPreAuthSecret) {
    errors.push('JWT_PRE_AUTH_SECRET: Variabel wajib diisi untuk isolasi tiket 2FA.');
  } else if (jwtPreAuthSecret.length < 16) {
    errors.push(
      `JWT_PRE_AUTH_SECRET: Panjang minimal 16 karakter demi isolasi keamanan 2FA. Panjang saat ini: ${jwtPreAuthSecret.length}`
    );
  }

  // 9. JWT_PRE_AUTH_EXPIRES_IN: string (misal: '3m') (default: '3m')
  const jwtPreAuthExpiresIn = (envSource.JWT_PRE_AUTH_EXPIRES_IN || '3m').trim();
  if (!jwtPreAuthExpiresIn) {
    errors.push('JWT_PRE_AUTH_EXPIRES_IN: Wajib berupa string non-kosong (misal: "3m").');
  }

  // 10. MIDTRANS_SERVER_KEY: string, wajib ada
  const midtransServerKey = envSource.MIDTRANS_SERVER_KEY ? String(envSource.MIDTRANS_SERVER_KEY).trim() : '';
  if (!midtransServerKey) {
    errors.push('MIDTRANS_SERVER_KEY: Variabel wajib diisi.');
  }

  // 11. MIDTRANS_CLIENT_KEY: string, wajib ada
  const midtransClientKey = envSource.MIDTRANS_CLIENT_KEY ? String(envSource.MIDTRANS_CLIENT_KEY).trim() : '';
  if (!midtransClientKey) {
    errors.push('MIDTRANS_CLIENT_KEY: Variabel wajib diisi.');
  }

  // 12. MIDTRANS_IS_PRODUCTION: boolean string ('true' | 'false')
  const rawMidtransIsProd = envSource.MIDTRANS_IS_PRODUCTION;
  let midtransIsProduction = false;
  if (rawMidtransIsProd === undefined || rawMidtransIsProd === null || String(rawMidtransIsProd).trim() === '') {
    errors.push("MIDTRANS_IS_PRODUCTION: Variabel wajib diisi dengan nilai 'true' atau 'false'.");
  } else {
    const normalized = String(rawMidtransIsProd).trim().toLowerCase();
    if (normalized !== 'true' && normalized !== 'false') {
      errors.push(
        `MIDTRANS_IS_PRODUCTION: Harus berupa string boolean ('true' | 'false'). Diterima: "${rawMidtransIsProd}"`
      );
    } else {
      midtransIsProduction = normalized === 'true';
    }
  }

  // 13. EMAIL_HOST: string (default: 'sandbox.smtp.mailtrap.io')
  const emailHost = (envSource.EMAIL_HOST || 'sandbox.smtp.mailtrap.io').trim();
  if (!emailHost) {
    errors.push('EMAIL_HOST: Wajib berupa string hostname valid.');
  }

  // 14. EMAIL_PORT: number (default: 2525)
  const rawEmailPort = envSource.EMAIL_PORT;
  let emailPort = 2525;
  if (rawEmailPort !== undefined && rawEmailPort !== '') {
    const parsedEmailPort = Number(rawEmailPort);
    if (!Number.isInteger(parsedEmailPort) || parsedEmailPort <= 0 || parsedEmailPort > 65535) {
      errors.push(
        `EMAIL_PORT: Harus berupa port numerik valid antara 1 dan 65535. Diterima: "${rawEmailPort}"`
      );
    } else {
      emailPort = parsedEmailPort;
    }
  }

  // 15. EMAIL_USER: string, wajib ada
  const emailUser = envSource.EMAIL_USER ? String(envSource.EMAIL_USER).trim() : '';
  if (!emailUser) {
    errors.push('EMAIL_USER: Variabel wajib diisi.');
  }

  // 16. EMAIL_PASS: string, wajib ada
  const emailPass = envSource.EMAIL_PASS ? String(envSource.EMAIL_PASS).trim() : '';
  if (!emailPass) {
    errors.push('EMAIL_PASS: Variabel wajib diisi.');
  }

  // 17. USE_TRANSACTIONS: boolean string ('true' | 'false')
  const rawUseTransactions = envSource.USE_TRANSACTIONS;
  let useTransactions = false;
  if (rawUseTransactions !== undefined && rawUseTransactions !== '') {
    const normalizedUseTx = String(rawUseTransactions).trim().toLowerCase();
    if (normalizedUseTx !== 'true' && normalizedUseTx !== 'false') {
      errors.push(
        `USE_TRANSACTIONS: Harus berupa boolean string ('true' | 'false'). Diterima: "${rawUseTransactions}"`
      );
    } else {
      useTransactions = normalizedUseTx === 'true';
    }
  }

  // 18. TOTP_WINDOW_STEPS: number (default: 1)
  const rawTotpSteps = envSource.TOTP_WINDOW_STEPS;
  let totpWindowSteps = 1;
  if (rawTotpSteps !== undefined && rawTotpSteps !== '') {
    const parsedTotp = Number(rawTotpSteps);
    if (!Number.isInteger(parsedTotp) || parsedTotp < 0) {
      errors.push(
        `TOTP_WINDOW_STEPS: Harus berupa integer positif atau 0. Diterima: "${rawTotpSteps}"`
      );
    } else {
      totpWindowSteps = parsedTotp;
    }
  }

  // FAIL-FAST HANDLING JIKA ADA ERROR
  if (errors.length > 0) {
    if (!options.silent) {
      console.error('\n' + '═'.repeat(72));
      console.error('💥 FATAL ERROR: ENVIRONMENT SCHEMA VALIDATION FAILED');
      console.error('═'.repeat(72));
      console.error(`Ditemukan ${errors.length} masalah konfigurasi environment pada backend:\n`);
      errors.forEach((err, index) => {
        console.error(`  [${index + 1}] ❌ ${err}`);
      });
      console.error('\n' + '─'.repeat(72));
      console.error('🛑 Server menolak menyala (Fail-Fast) demi integritas & keamanan sistem.');
      console.error('👉 Periksa kembali file .env atau environment runtime server Anda.');
      console.error('═'.repeat(72) + '\n');
    }

    if (exitOnError) {
      process.exit(1);
    }

    const validationError = new Error(
      `Environment validation failed with ${errors.length} error(s):\n${errors.join('\n')}`
    );
    validationError.errors = errors;
    throw validationError;
  }

  // JIKA VALID: Bentuk Objek ENV Ter-parse, Ter-sanitize, dan Ter-freeze
  const parsedEnv = {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    MONGO_URI: databaseUrl,
    MONGODB_URI: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: jwtExpiresIn,
    JWT_REFRESH_SECRET: jwtRefreshSecret,
    JWT_REFRESH_EXPIRES_IN: jwtRefreshExpiresIn,
    JWT_PRE_AUTH_SECRET: jwtPreAuthSecret,
    JWT_PRE_AUTH_EXPIRES_IN: jwtPreAuthExpiresIn,
    MIDTRANS_SERVER_KEY: midtransServerKey,
    MIDTRANS_CLIENT_KEY: midtransClientKey,
    MIDTRANS_IS_PRODUCTION: midtransIsProduction,
    EMAIL_HOST: emailHost,
    EMAIL_PORT: emailPort,
    EMAIL_USER: emailUser,
    EMAIL_PASS: emailPass,
    USE_TRANSACTIONS: useTransactions,
    TOTP_WINDOW_STEPS: totpWindowSteps,
    IS_PRODUCTION: nodeEnv === 'production',
    IS_DEVELOPMENT: nodeEnv === 'development',
    IS_TEST: nodeEnv === 'test',
  };

  // Sinkronisasi kembali ke process.env untuk memastikan modul downstream aman
  if (!options.customEnv) {
    process.env.NODE_ENV = parsedEnv.NODE_ENV;
    process.env.PORT = String(parsedEnv.PORT);
    process.env.DATABASE_URL = parsedEnv.DATABASE_URL;
    process.env.MONGO_URI = parsedEnv.DATABASE_URL;
    process.env.MONGODB_URI = parsedEnv.DATABASE_URL;
    process.env.JWT_SECRET = parsedEnv.JWT_SECRET;
    process.env.JWT_EXPIRES_IN = parsedEnv.JWT_EXPIRES_IN;
    process.env.JWT_REFRESH_SECRET = parsedEnv.JWT_REFRESH_SECRET;
    process.env.JWT_REFRESH_EXPIRES_IN = parsedEnv.JWT_REFRESH_EXPIRES_IN;
    process.env.JWT_PRE_AUTH_SECRET = parsedEnv.JWT_PRE_AUTH_SECRET;
    process.env.JWT_PRE_AUTH_EXPIRES_IN = parsedEnv.JWT_PRE_AUTH_EXPIRES_IN;
    process.env.MIDTRANS_SERVER_KEY = parsedEnv.MIDTRANS_SERVER_KEY;
    process.env.MIDTRANS_CLIENT_KEY = parsedEnv.MIDTRANS_CLIENT_KEY;
    process.env.MIDTRANS_IS_PRODUCTION = String(parsedEnv.MIDTRANS_IS_PRODUCTION);
    process.env.EMAIL_HOST = parsedEnv.EMAIL_HOST;
    process.env.EMAIL_PORT = String(parsedEnv.EMAIL_PORT);
    process.env.EMAIL_USER = parsedEnv.EMAIL_USER;
    process.env.EMAIL_PASS = parsedEnv.EMAIL_PASS;
    process.env.USE_TRANSACTIONS = String(parsedEnv.USE_TRANSACTIONS);
    process.env.TOTP_WINDOW_STEPS = String(parsedEnv.TOTP_WINDOW_STEPS);
    cachedEnv = Object.freeze(parsedEnv);
  }

  const frozenResult = Object.freeze(parsedEnv);

  // Cetak ringkasan mode sistem ke konsol secara aman (sensor seluruh secret)
  if (parsedEnv.NODE_ENV !== 'test' && !options.silent) {
    console.log('\n' + '═'.repeat(60));
    console.log('🛡️  GREENPAY BACKEND ENVIRONMENT: VALIDATED & LOCKED');
    console.log('═'.repeat(60));
    console.log(`  • NODE_ENV               : ${parsedEnv.NODE_ENV}`);
    console.log(`  • PORT                   : ${parsedEnv.PORT}`);
    console.log(`  • DATABASE_URL           : ${sanitizeDatabaseUri(parsedEnv.DATABASE_URL)}`);
    console.log(`  • JWT_SECRET             : ${maskSecret(parsedEnv.JWT_SECRET, 4, 2)} (len: ${parsedEnv.JWT_SECRET.length})`);
    console.log(`  • JWT_EXPIRES_IN         : ${parsedEnv.JWT_EXPIRES_IN}`);
    console.log(`  • JWT_REFRESH_SECRET     : ${maskSecret(parsedEnv.JWT_REFRESH_SECRET, 4, 2)} (len: ${parsedEnv.JWT_REFRESH_SECRET.length})`);
    console.log(`  • JWT_REFRESH_EXPIRES_IN : ${parsedEnv.JWT_REFRESH_EXPIRES_IN}`);
    console.log(`  • JWT_PRE_AUTH_SECRET    : ${maskSecret(parsedEnv.JWT_PRE_AUTH_SECRET, 4, 2)} (len: ${parsedEnv.JWT_PRE_AUTH_SECRET.length})`);
    console.log(`  • JWT_PRE_AUTH_EXPIRES_IN: ${parsedEnv.JWT_PRE_AUTH_EXPIRES_IN}`);
    console.log(`  • MIDTRANS_SERVER_KEY    : ${maskSecret(parsedEnv.MIDTRANS_SERVER_KEY, 6, 2)}`);
    console.log(`  • MIDTRANS_CLIENT_KEY    : ${maskSecret(parsedEnv.MIDTRANS_CLIENT_KEY, 6, 2)}`);
    console.log(`  • MIDTRANS_IS_PRODUCTION : ${parsedEnv.MIDTRANS_IS_PRODUCTION}`);
    console.log(`  • EMAIL_HOST             : ${parsedEnv.EMAIL_HOST}`);
    console.log(`  • EMAIL_PORT             : ${parsedEnv.EMAIL_PORT}`);
    console.log(`  • EMAIL_USER             : ${parsedEnv.EMAIL_USER}`);
    console.log(`  • EMAIL_PASS             : [REDACTED]`);
    console.log(`  • USE_TRANSACTIONS       : ${parsedEnv.USE_TRANSACTIONS}`);
    console.log(`  • TOTP_WINDOW_STEPS      : ${parsedEnv.TOTP_WINDOW_STEPS}`);
    console.log('═'.repeat(60) + '\n');
  }

  return frozenResult;
}

/**
 * Dapatkan objek konfigurasi ENV yang telah tervalidasi.
 * Jika belum divalidasi, jalankan validateEnv() secara otomatis.
 * @returns {Readonly<object>}
 */
function getEnv() {
  if (!cachedEnv) {
    return validateEnv();
  }
  return cachedEnv;
}

module.exports = {
  validateEnv,
  getEnv,
};

// Getter properti ENV langsung pada modul untuk kemudahan import: const { ENV } = require('./envValidator');
Object.defineProperty(module.exports, 'ENV', {
  get() {
    return getEnv();
  },
  enumerable: true,
});
