/**
 * WebView Security Utilities for In-App Payment Gateway
 *
 * Implements strict domain whitelisting, intent guards, and sandbox protections
 * to mitigate Open-Redirect vulnerabilities, session hijacking, phishing injection,
 * and malicious intent execution.
 */

/**
 * Whitelist of official Midtrans payment gateway domains.
 * Only HTTPS connections to these domains (or their direct subdomains) are permitted.
 */
export const ALLOWED_PAYMENT_DOMAINS = [
  'app.sandbox.midtrans.com',
  'app.midtrans.com',
  'api.sandbox.midtrans.com',
  'api.midtrans.com',
];

/**
 * Known third-party digital wallet, banking, and mobile OS intent schemes.
 */
export const EXTERNAL_APP_SCHEMES = [
  'gojek',
  'gopay',
  'shopeepay',
  'ovo',
  'dana',
  'linkaja',
  'intent',
  'tel',
  'sms',
  'whatsapp',
  'market',
  'bca',
  'mbca',
  'livin',
  'mandiri',
  'bankmandiri',
  'brimo',
  'bri',
  'bni',
  'cimbclicks',
  'octomobile',
  'permatanet',
  'kredivo',
  'akulaku',
  'jenius',
  'blu',
  'aladin',
  'seabank',
  'jago',
] as const;

/**
 * Validates whether a given URL is safe and belongs to official Midtrans domains
 * or internal GreenPay callback schemes.
 *
 * Validation rules:
 * 1. Non-empty string.
 * 2. Internal scheme: `greenpay://` is permitted.
 * 3. Protocol MUST strictly be `https:`.
 * 4. Hostname MUST exactly match or be a subdomain of an entry in ALLOWED_PAYMENT_DOMAINS.
 *
 * @param url The URL to inspect
 * @returns boolean True if the URL is strictly whitelisted, false otherwise
 */
export const isWhitelistedPaymentUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim();

  // Allow internal GreenPay deep-link / callback schemes
  if (trimmedUrl.toLowerCase().startsWith('greenpay://')) {
    return true;
  }

  try {
    const parsed = new URL(trimmedUrl);

    // Enforce strict HTTPS - never allow plain HTTP, file, javascript, or data schemes
    if (parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) {
      return false;
    }

    return ALLOWED_PAYMENT_DOMAINS.some(
      (allowedDomain) =>
        hostname === allowedDomain || hostname.endsWith(`.${allowedDomain}`)
    );
  } catch {
    // Malformed or unparseable URLs are rejected immediately
    return false;
  }
};

/**
 * Detects whether a URL uses an external digital wallet, banking, or non-HTTP scheme
 * (e.g. `gojek://`, `shopeepay://`, `intent://`, `tel:`, `sms:`).
 *
 * Explicitly guards against dangerous web/script schemes (javascript, data, file, blob).
 *
 * @param url The URL to inspect
 * @returns boolean True if URL targets an external app scheme
 */
export const isExternalAppScheme = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim().toLowerCase();

  // Explicitly reject web, internal, and dangerous executable schemes
  if (
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://') ||
    trimmedUrl.startsWith('greenpay://') ||
    trimmedUrl.startsWith('about:') ||
    trimmedUrl.startsWith('javascript:') ||
    trimmedUrl.startsWith('data:') ||
    trimmedUrl.startsWith('file:') ||
    trimmedUrl.startsWith('blob:')
  ) {
    return false;
  }

  // Check scheme component
  const schemeMatch = trimmedUrl.match(/^([a-z0-9+.-]+):/);
  if (!schemeMatch) {
    return false;
  }

  const scheme = schemeMatch[1];
  return (
    EXTERNAL_APP_SCHEMES.includes(scheme as any) ||
    trimmedUrl.startsWith('intent://')
  );
};
