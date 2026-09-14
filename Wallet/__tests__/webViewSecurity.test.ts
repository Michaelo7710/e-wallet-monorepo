import {
  ALLOWED_PAYMENT_DOMAINS,
  isWhitelistedPaymentUrl,
  isExternalAppScheme,
} from '../src/features/payment/utils/webViewSecurity';

describe('TASK-B2-04: WebView Security Utilities Unit Tests', () => {
  describe('ALLOWED_PAYMENT_DOMAINS', () => {
    it('harus memuat domain resmi Midtrans sandbox dan production', () => {
      expect(ALLOWED_PAYMENT_DOMAINS).toContain('app.sandbox.midtrans.com');
      expect(ALLOWED_PAYMENT_DOMAINS).toContain('app.midtrans.com');
      expect(ALLOWED_PAYMENT_DOMAINS).toContain('api.sandbox.midtrans.com');
      expect(ALLOWED_PAYMENT_DOMAINS).toContain('api.midtrans.com');
    });
  });

  describe('isWhitelistedPaymentUrl', () => {
    it('harus mengizinkan URL Midtrans sandbox resmi dengan protokol HTTPS', () => {
      expect(
        isWhitelistedPaymentUrl('https://app.sandbox.midtrans.com/snap/v2/vtweb/token123')
      ).toBe(true);
      expect(
        isWhitelistedPaymentUrl('https://api.sandbox.midtrans.com/v2/charge')
      ).toBe(true);
    });

    it('harus mengizinkan URL Midtrans production resmi dengan protokol HTTPS', () => {
      expect(
        isWhitelistedPaymentUrl('https://app.midtrans.com/snap/v2/vtweb/token456')
      ).toBe(true);
      expect(
        isWhitelistedPaymentUrl('https://api.midtrans.com/v2/charge')
      ).toBe(true);
    });

    it('harus mengizinkan subdomain dari domain resmi Midtrans', () => {
      expect(
        isWhitelistedPaymentUrl('https://sub.app.midtrans.com/snap/pay')
      ).toBe(true);
    });

    it('harus mengizinkan skema internal GreenPay callback (greenpay://)', () => {
      expect(isWhitelistedPaymentUrl('greenpay://payment/finish')).toBe(true);
      expect(isWhitelistedPaymentUrl('greenpay://callback?order_id=123')).toBe(true);
    });

    it('harus menolak URL Midtrans yang menggunakan protokol tidak aman (HTTP plain)', () => {
      expect(
        isWhitelistedPaymentUrl('http://app.sandbox.midtrans.com/snap/v2/vtweb/token123')
      ).toBe(false);
      expect(
        isWhitelistedPaymentUrl('http://app.midtrans.com/snap/v2/vtweb/token456')
      ).toBe(false);
    });

    it('harus menolak domain asing dan website di luar whitelist (open-redirect prevention)', () => {
      expect(isWhitelistedPaymentUrl('https://google.com')).toBe(false);
      expect(isWhitelistedPaymentUrl('https://attacker.com/midtrans-phishing')).toBe(false);
      expect(isWhitelistedPaymentUrl('https://evil-midtrans.com')).toBe(false);
      expect(isWhitelistedPaymentUrl('https://app.midtrans.com.evil.com/fake')).toBe(false);
    });

    it('harus menolak skema berbahaya (javascript, file, data, blob)', () => {
      expect(isWhitelistedPaymentUrl('javascript:alert("hacked")')).toBe(false);
      expect(isWhitelistedPaymentUrl('file:///etc/passwd')).toBe(false);
      expect(isWhitelistedPaymentUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isWhitelistedPaymentUrl('blob:https://app.midtrans.com/uuid')).toBe(false);
    });

    it('harus menolak input kosong, null, undefined, atau string tidak valid', () => {
      expect(isWhitelistedPaymentUrl('')).toBe(false);
      expect(isWhitelistedPaymentUrl('   ')).toBe(false);
      expect(isWhitelistedPaymentUrl(null as any)).toBe(false);
      expect(isWhitelistedPaymentUrl(undefined as any)).toBe(false);
      expect(isWhitelistedPaymentUrl('not-a-valid-url')).toBe(false);
    });
  });

  describe('isExternalAppScheme', () => {
    it('harus mendeteksi skema dompet digital (GoPay, ShopeePay, OVO, DANA, LinkAja)', () => {
      expect(isExternalAppScheme('gojek://gopay/merchantpay?qr=123')).toBe(true);
      expect(isExternalAppScheme('gopay://pay?qr=123')).toBe(true);
      expect(isExternalAppScheme('shopeepay://payment/pay?id=456')).toBe(true);
      expect(isExternalAppScheme('ovo://payment?id=789')).toBe(true);
      expect(isExternalAppScheme('dana://qr?code=abc')).toBe(true);
      expect(isExternalAppScheme('linkaja://payment')).toBe(true);
    });

    it('harus mendeteksi skema intent Android dan komunikasi (intent, tel, sms, whatsapp, market)', () => {
      expect(
        isExternalAppScheme('intent://#Intent;scheme=gopay;package=com.gojek.app;end')
      ).toBe(true);
      expect(isExternalAppScheme('tel:08123456789')).toBe(true);
      expect(isExternalAppScheme('sms:08123456789?body=pay')).toBe(true);
      expect(isExternalAppScheme('whatsapp://send?phone=628123456789')).toBe(true);
      expect(isExternalAppScheme('market://details?id=com.gojek.app')).toBe(true);
    });

    it('harus mendeteksi skema perbankan nasional (BCA, Livin, Mandiri, BRIMo, BNI, CIMB)', () => {
      expect(isExternalAppScheme('bca://open')).toBe(true);
      expect(isExternalAppScheme('mbca://open')).toBe(true);
      expect(isExternalAppScheme('livin://payment')).toBe(true);
      expect(isExternalAppScheme('mandiri://payment')).toBe(true);
      expect(isExternalAppScheme('brimo://pay')).toBe(true);
      expect(isExternalAppScheme('bni://pay')).toBe(true);
      expect(isExternalAppScheme('cimbclicks://pay')).toBe(true);
      expect(isExternalAppScheme('kredivo://pay')).toBe(true);
      expect(isExternalAppScheme('akulaku://pay')).toBe(true);
    });

    it('harus mengembalikan false untuk URL web standar (http, https)', () => {
      expect(isExternalAppScheme('https://app.midtrans.com')).toBe(false);
      expect(isExternalAppScheme('http://example.com')).toBe(false);
    });

    it('harus mengembalikan false untuk skema internal GreenPay dan browser internal', () => {
      expect(isExternalAppScheme('greenpay://callback')).toBe(false);
      expect(isExternalAppScheme('about:blank')).toBe(false);
    });

    it('harus mengembalikan false untuk skema berbahaya (javascript, data, file, blob)', () => {
      expect(isExternalAppScheme('javascript:evil()')).toBe(false);
      expect(isExternalAppScheme('data:text/html,test')).toBe(false);
      expect(isExternalAppScheme('file:///sdcard/exploit.apk')).toBe(false);
      expect(isExternalAppScheme('blob:https://evil.com/123')).toBe(false);
    });

    it('harus mengembalikan false untuk input falsy / tidak valid', () => {
      expect(isExternalAppScheme('')).toBe(false);
      expect(isExternalAppScheme('   ')).toBe(false);
      expect(isExternalAppScheme(null as any)).toBe(false);
      expect(isExternalAppScheme(undefined as any)).toBe(false);
    });
  });
});
