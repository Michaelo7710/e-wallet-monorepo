// tests/crypto.test.js
const { encryptTOTPSecret, decryptTOTPSecret } = require('../src/utils/crypto');

describe('🔐 [CRYPTO UTILITY - AES-256-GCM TOTP SECRET ENCRYPTION]', () => {
  const sampleSecret = 'JBSWY3DPEHPK3PXP';

  it('1. Harus mengenkripsi secret Base32 ke format terisolasi enc:<iv>:<tag>:<ciphertext>', () => {
    const encrypted = encryptTOTPSecret(sampleSecret);

    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe('string');
    expect(encrypted.startsWith('enc:')).toBe(true);
    expect(encrypted).not.toBe(sampleSecret);

    const parts = encrypted.slice(4).split(':');
    expect(parts.length).toBe(3); // iv, authTag, ciphertext
    expect(parts[0].length).toBe(24); // 12 bytes = 24 hex chars
    expect(parts[1].length).toBe(32); // 16 bytes auth tag = 32 hex chars
    expect(parts[2].length).toBeGreaterThan(0);
  });

  it('2. Harus sukses mendekripsi kembali ke string Base32 asli secara lossless', () => {
    const encrypted = encryptTOTPSecret(sampleSecret);
    const decrypted = decryptTOTPSecret(encrypted);

    expect(decrypted).toBe(sampleSecret);
  });

  it('3. Tidak melakukan double encryption jika string sudah berformat enc:', () => {
    const encryptedOnce = encryptTOTPSecret(sampleSecret);
    const encryptedTwice = encryptTOTPSecret(encryptedOnce);

    expect(encryptedTwice).toBe(encryptedOnce);
  });

  it('4. Backward-compatible: Mengembalikan string apa adanya jika bukan format enc: (legacy plaintext)', () => {
    const plainLegacy = 'NATIVEPLAINTEXTBASE32SECRET';
    const result = decryptTOTPSecret(plainLegacy);

    expect(result).toBe(plainLegacy);
  });

  it('5. Menangani input falsy (null/undefined/empty) dengan aman', () => {
    expect(encryptTOTPSecret(null)).toBeNull();
    expect(encryptTOTPSecret('')).toBe('');
    expect(decryptTOTPSecret(null)).toBeNull();
    expect(decryptTOTPSecret('')).toBe('');
  });
});
