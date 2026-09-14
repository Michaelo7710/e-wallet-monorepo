/**
 * GreenPay Mobile PII Sanitizer & Data Redactor
 * 
 * Bertanggung jawab membersihkan dan menyamarkan data sensitif (Personally Identifiable Information)
 * sebelum disimpan pada breadcrumbs lokal atau dikirim ke sistem telemetri/crash reporting pihak ketiga.
 */

export const SENSITIVE_KEYS: readonly string[] = [
  'password',
  'pin',
  'old_password',
  'new_password',
  'confirm_new_password',
  'old_pin',
  'new_pin',
  'confirm_new_pin',
  'token',
  'pre_auth_token',
  'refresh_token',
  'two_factor_secret',
  'nik',
  'authorization',
] as const;

/**
 * Samarkan nomor telepon menjadi format: 0812****7890
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  const clean = phone.trim();
  if (clean.length < 8) return '****';
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start}****${end}`;
}

/**
 * Samarkan alamat email menjadi format: u***@domain.com
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return '***@***';
  const [user, domain] = parts;
  const firstChar = user.charAt(0) || 'u';
  return `${firstChar}***@${domain}`;
}

/**
 * Samarkan Nomor Induk Kependudukan (NIK) menjadi format: 3201**********01
 */
export function maskNik(nik: string): string {
  if (!nik || typeof nik !== 'string') return '';
  const clean = nik.trim();
  if (clean.length < 6) return '****************';
  const start = clean.slice(0, 4);
  const end = clean.slice(-2);
  const asterisks = '*'.repeat(Math.max(4, clean.length - 6));
  return `${start}${asterisks}${end}`;
}

/**
 * Sanitasi rekursif payload data objek/array dari seluruh jejak PII.
 * Membatasi kedalaman hingga 5 tingkat untuk mencegah circular references (Green Computing).
 * 
 * @param data Data yang akan disanitasi
 * @param depth Tingkat kedalaman rekursi saat ini
 * @returns Data yang telah steril dari PII
 */
export function sanitizePayload(data: any, depth = 0): any {
  // 1. Guard Kedalaman Maksimal 5 Tingkat
  if (depth > 5) {
    return '[MAX_DEPTH_REACHED]';
  }

  // 2. Tipe Primitif & Null / Undefined
  if (data === null || data === undefined || typeof data !== 'object') {
    return data;
  }

  // 3. Array Handling
  if (Array.isArray(data)) {
    return data.map((item) => sanitizePayload(item, depth + 1));
  }

  // 4. Object Handling
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // A. Kunci rahasia mutlak: Langsung disensor [REDACTED]
    if (SENSITIVE_KEYS.includes(lowerKey)) {
      sanitized[key] = '[REDACTED]';
    }
    // B. Deteksi Pola Email
    else if (lowerKey.includes('email') && typeof value === 'string') {
      sanitized[key] = maskEmail(value);
    }
    // C. Deteksi Pola Nomor HP / Telepon
    else if (
      (lowerKey.includes('phone') || lowerKey.includes('nohp') || lowerKey.includes('mobile')) &&
      typeof value === 'string'
    ) {
      sanitized[key] = maskPhoneNumber(value);
    }
    // D. Deteksi Pola NIK Turunan (misal: user_nik, no_nik)
    else if (lowerKey.includes('nik') && typeof value === 'string') {
      sanitized[key] = maskNik(value);
    }
    // E. Objek Bersarang Rekursif
    else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizePayload(value, depth + 1);
    }
    // F. Data Non-Sensitif Lainnya
    else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
