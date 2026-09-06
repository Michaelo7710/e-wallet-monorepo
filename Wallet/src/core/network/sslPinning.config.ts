/**
 * GreenPay SSL/TLS Public Key Pinning Configuration (HPKP Style)
 * 
 * Mencegah serangan Man-in-the-Middle (MITM) dengan memvalidasi fingerprint SHA-256
 * Subject Public Key Info (SPKI) untuk domain resmi GreenPay dan gateway transaksi finansial.
 */

export interface SslPinningConfig {
  domain: string;
  publicKeyHashes: string[]; // SHA-256 SPKI fingerprint
}

export const PINNED_DOMAINS: Record<string, string[]> = {
  'greenpay.id': [
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Primary Certificate Pin
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=', // Backup Disaster Recovery Pin
  ],
  'app.midtrans.com': [
    'sha256/k2NsJrCdS8xkdEiKFJnxLQ99/7VJaIoUleJAvkA9w2M=',
  ],
  'app.sandbox.midtrans.com': [
    'sha256/k2NsJrCdS8xkdEiKFJnxLQ99/7VJaIoUleJAvkA9w2M=',
  ],
};

/**
 * Ekstraksi hostname murni dari URL atau host string
 */
export function extractHostname(urlOrHost: string): string {
  try {
    if (urlOrHost.startsWith('http://') || urlOrHost.startsWith('https://')) {
      const url = new URL(urlOrHost);
      return url.hostname.toLowerCase();
    }
    // Jika hanya format domain (misal: "app.midtrans.com:443" atau "app.midtrans.com")
    const cleanHost = urlOrHost.split('/')[0].split(':')[0];
    return cleanHost.toLowerCase();
  } catch {
    return urlOrHost.toLowerCase();
  }
}

/**
 * Memvalidasi apakah hostname termasuk dalam daftar domain yang ter-pin
 */
export function isPinnedHost(hostname: string): boolean {
  if (!hostname) return false;
  const clean = extractHostname(hostname);

  if (PINNED_DOMAINS[clean]) {
    return true;
  }

  // Periksa kecocokan subdomain (misal api.greenpay.id cocok dengan greenpay.id)
  return Object.keys(PINNED_DOMAINS).some(
    (domain) => clean === domain || clean.endsWith('.' + domain)
  );
}

/**
 * Mengambil daftar hash SHA-256 yang di-pin untuk host tertentu
 */
export function getPinnedHashes(hostname: string): string[] | undefined {
  if (!hostname) return undefined;
  const clean = extractHostname(hostname);

  if (PINNED_DOMAINS[clean]) {
    return PINNED_DOMAINS[clean];
  }

  const matchedDomain = Object.keys(PINNED_DOMAINS).find(
    (domain) => clean === domain || clean.endsWith('.' + domain)
  );

  return matchedDomain ? PINNED_DOMAINS[matchedDomain] : undefined;
}
