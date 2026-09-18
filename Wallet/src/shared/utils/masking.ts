/**
 * Utility functions for masking sensitive financial and personal data
 * in compliance with UU Perlindungan Data Pribadi (UU PDP).
 */

/**
 * Masks a bank account number, preserving only the last 4 digits.
 * Example: '1234567890' -> '******7890'
 * Example: '1234561234' -> '******1234'
 */
export const maskBankAccount = (accountNumber?: string | null): string => {
  if (!accountNumber) return '-';
  const clean = accountNumber.trim();
  if (clean.length === 0) return '-';
  if (clean.length <= 4) {
    return '*'.repeat(clean.length);
  }
  const last4 = clean.slice(-4);
  const maskedPrefix = '*'.repeat(clean.length - 4);
  return `${maskedPrefix}${last4}`;
};

/**
 * Masks a phone number, preserving the first 4 and last 4 digits,
 * replacing the middle digits with 4 asterisks.
 * Example: '081234568901' -> '0812****8901'
 * Example: '081299990000' -> '0812****0000'
 */
export const maskPhoneNumber = (phoneNumber?: string | null): string => {
  if (!phoneNumber) return '-';
  const clean = phoneNumber.trim();
  if (clean.length === 0) return '-';

  if (clean.length <= 8) {
    if (clean.length <= 4) return '*'.repeat(clean.length);
    const prefix = clean.slice(0, 2);
    const suffix = clean.slice(-2);
    return `${prefix}****${suffix}`;
  }

  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `${prefix}****${suffix}`;
};

/**
 * Masks a NIK (Nomor Induk Kependudukan 16 Digit), preserving the first 4 and last 4 digits,
 * replacing the middle 8 digits with asterisks in standard 4-digit block format: 3201 **** **** 0001.
 * Example: '3201123456780001' -> '3201 **** **** 0001'
 */
export const maskNik = (nik?: string | null): string => {
  if (!nik) return '-';
  const clean = nik.trim();
  if (clean.length === 0) return '-';
  if (clean.length < 8) return '*'.repeat(clean.length);
  if (clean.length < 16) {
    const prefix = clean.slice(0, 4);
    const suffix = clean.slice(-4);
    return `${prefix} **** ${suffix}`;
  }
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `${prefix} **** **** ${suffix}`;
};

/**
 * Generic masking helper for sensitive identifiers (e.g. NIK, card numbers).
 */
export const maskIdentifier = (id?: string | null, visibleLast: number = 4): string => {
  if (!id) return '-';
  const clean = id.trim();
  if (clean.length <= visibleLast) return '*'.repeat(clean.length);
  const suffix = clean.slice(-visibleLast);
  return `${'*'.repeat(clean.length - visibleLast)}${suffix}`;
};
