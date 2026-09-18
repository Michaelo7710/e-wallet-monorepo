// src/utils/crypto.js
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes standard untuk AES-GCM
const PREFIX = 'enc:';

/**
 * Turunkan master key 32 bytes (256 bits) secara deterministik menggunakan SHA-256.
 */
const getEncryptionKey = () => {
  const masterKey = process.env.TOTP_ENCRYPTION_KEY || 'greenpay-default-totp-aes-256-gcm-master-key-32chars';
  return crypto.createHash('sha256').update(masterKey).digest();
};

/**
 * Enkripsi rahasia TOTP Base32 menggunakan AES-256-GCM.
 * Output terformat: enc:<iv_hex>:<authTag_hex>:<cipher_hex>
 * @param {string} plainText
 * @returns {string}
 */
const encryptTOTPSecret = (plainText) => {
  if (!plainText || typeof plainText !== 'string') return plainText;
  if (plainText.startsWith(PREFIX)) return plainText; // Anti double encryption

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  return `${PREFIX}${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Dekripsi rahasia TOTP AES-256-GCM kembali ke string Base32 asli.
 * Jika format tidak terenkripsi (misal legacy plaintext), kembalikan apa adanya.
 * @param {string} cipherText
 * @returns {string}
 */
const decryptTOTPSecret = (cipherText) => {
  if (!cipherText || typeof cipherText !== 'string') return cipherText;
  if (!cipherText.startsWith(PREFIX)) return cipherText;

  const parts = cipherText.slice(PREFIX.length).split(':');
  if (parts.length !== 3) return cipherText;

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

module.exports = {
  encryptTOTPSecret,
  decryptTOTPSecret,
};
