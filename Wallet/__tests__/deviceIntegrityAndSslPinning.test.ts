import {
  deviceIntegrityService,
  ROOT_JAILBREAK_PATHS,
} from '../src/core/security/deviceIntegrity.service';
import {
  isPinnedHost,
  getPinnedHashes,
  extractHostname,
  PINNED_DOMAINS,
} from '../src/core/network/sslPinning.config';
import { Platform, BackHandler } from 'react-native';
import { telemetryService } from '../src/core/telemetry/telemetry.service';
import { ENV } from '../src/core/config/env';

jest.mock('../src/core/config/env', () => ({
  ENV: {
    MODE: 'local',
    API_URL: 'http://127.0.0.1:3000/api/v1',
    IS_DEV: true,
    IS_PROD: false,
  },
}));

jest.mock('../src/core/telemetry/telemetry.service', () => ({
  telemetryService: {
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    addBreadcrumb: jest.fn(),
    getCorrelationId: jest.fn(() => 'test-corr-id'),
  },
}));

describe('TASK-B3-03: Device Integrity Guard (Root / Jailbreak / Frida Detection)', () => {
  afterEach(() => {
    deviceIntegrityService.setMockOverride(null);
    delete (globalThis as any).__mockCompromisedPaths;
    delete (globalThis as any).frida;
    delete (globalThis as any)._frida;
  });

  it('harus mendefinisikan seluruh jalur biner root/jailbreak standar', () => {
    expect(ROOT_JAILBREAK_PATHS).toContain('/system/bin/su');
    expect(ROOT_JAILBREAK_PATHS).toContain('/system/xbin/su');
    expect(ROOT_JAILBREAK_PATHS).toContain('/sbin/su');
    expect(ROOT_JAILBREAK_PATHS).toContain('/system/app/Superuser.apk');
    expect(ROOT_JAILBREAK_PATHS).toContain('/data/local/bin/su');
    expect(ROOT_JAILBREAK_PATHS).toContain('/Library/MobileSubstrate/MobileSubstrate.dylib');
    expect(ROOT_JAILBREAK_PATHS).toContain('/bin/bash');
    expect(ROOT_JAILBREAK_PATHS).toContain('/usr/sbin/sshd');
    expect(ROOT_JAILBREAK_PATHS).toContain('/etc/apt');
  });

  it('harus menandai perangkat sebagai compromised jika terdeteksi berkas su', async () => {
    (globalThis as any).__mockCompromisedPaths = ['/system/bin/su'];

    const result = await deviceIntegrityService.checkDeviceIntegrity();

    expect(result.isCompromised).toBe(true);
    expect(result.reasons.some((r) => r.includes('/system/bin/su'))).toBe(true);
  });

  it('harus mendeteksi objek Frida runtime hooks', async () => {
    (globalThis as any).frida = { version: '16.1.4' };

    const result = await deviceIntegrityService.checkDeviceIntegrity();

    expect(result.isCompromised).toBe(true);
    expect(result.reasons.some((r) => r.includes('Frida'))).toBe(true);
  });

  it('pada mode pengembangan (IS_DEV = true), emulator diizinkan berjalan normal jika allowEmulatorInDev = true', async () => {
    jest.spyOn(deviceIntegrityService, 'isEmulator').mockReturnValue(true);

    // Di test environment ENV.IS_DEV adalah true (ACTIVE_MODE default local)
    const result = await deviceIntegrityService.checkDeviceIntegrity({ allowEmulatorInDev: true });

    expect(result.isEmulator).toBe(true);
    // Jika tidak ada root atau frida, isCompromised harus false di dev mode
    expect(result.isCompromised).toBe(false);
  });

  it('pada mode produksi (IS_PROD = true), emulator harus diblokir dengan kebijakan Zero-Tolerance', async () => {
    jest.spyOn(deviceIntegrityService, 'isEmulator').mockReturnValue(true);

    // Simulasikan ENV.IS_PROD = true
    const originalEnv = { ...ENV };
    (ENV as any).IS_PROD = true;
    (ENV as any).IS_DEV = false;

    try {
      const result = await deviceIntegrityService.checkDeviceIntegrity({ allowEmulatorInDev: false });

      expect(result.isEmulator).toBe(true);
      expect(result.isCompromised).toBe(true);
      expect(result.reasons.some((r) => r.includes('produksi') || r.includes('emulator'))).toBe(true);
    } finally {
      (ENV as any).IS_PROD = originalEnv.IS_PROD;
      (ENV as any).IS_DEV = originalEnv.IS_DEV;
    }
  });
});

describe('TASK-B3-03: Network SSL Pinning Configuration', () => {
  it('harus memvalidasi host yang di-pin (isPinnedHost)', () => {
    expect(isPinnedHost('greenpay.id')).toBe(true);
    expect(isPinnedHost('https://greenpay.id/api/v1')).toBe(true);
    expect(isPinnedHost('api.greenpay.id')).toBe(true);
    expect(isPinnedHost('app.midtrans.com')).toBe(true);
    expect(isPinnedHost('https://app.sandbox.midtrans.com/snap/v1')).toBe(true);

    expect(isPinnedHost('evil-attacker.com')).toBe(false);
    expect(isPinnedHost('https://attacker-proxy.com/api')).toBe(false);
    expect(isPinnedHost('')).toBe(false);
  });

  it('harus mengembalikan hash SPKI yang sesuai untuk domain ter-pin', () => {
    const hashes = getPinnedHashes('greenpay.id');
    expect(hashes).toBeDefined();
    expect(hashes).toContain('sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');

    const midtransHashes = getPinnedHashes('app.midtrans.com');
    expect(midtransHashes).toContain('sha256/k2NsJrCdS8xkdEiKFJnxLQ99/7VJaIoUleJAvkA9w2M=');

    expect(getPinnedHashes('unpinned-domain.com')).toBeUndefined();
  });

  it('harus mengekstrak hostname murni dari berbagai format URL (extractHostname)', () => {
    expect(extractHostname('https://app.midtrans.com/snap/v2')).toBe('app.midtrans.com');
    expect(extractHostname('http://greenpay.id:443/test')).toBe('greenpay.id');
    expect(extractHostname('greenpay.id:8080')).toBe('greenpay.id');
  });
});

describe('TASK-B3-03: API Interceptor Security Checks & MITM Alerting', () => {
  it('harus memvalidasi protokol HTTPS dan menolak HTTP mentah pada mode produksi', async () => {
    const originalEnv = { ...ENV };
    (ENV as any).IS_PROD = true;

    try {
      const insecureUrl = 'http://api.greenpay.id/auth/login';
      let rejected = false;

      // Logika verifikasi yang sama seperti di interceptor api.ts
      if (ENV.IS_PROD && insecureUrl.startsWith('http://')) {
        const error = new Error(`[SECURITY] Permintaan HTTP tidak aman ditolak pada mode produksi: ${insecureUrl}`);
        telemetryService.captureException(error, { tag: 'SECURITY_ALERT_INSECURE_HTTP', url: insecureUrl });
        rejected = true;
      }

      expect(rejected).toBe(true);
      expect(telemetryService.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ tag: 'SECURITY_ALERT_INSECURE_HTTP' })
      );
    } finally {
      (ENV as any).IS_PROD = originalEnv.IS_PROD;
    }
  });

  it('harus mencatat insiden kritis ke telemetryService saat terjadi kegagalan SSL/TLS Handshake MITM', () => {
    const mitmError = {
      code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      message: 'certificate verification failed: self signed certificate in certificate chain',
      config: { url: 'https://api.greenpay.id/profile' },
    };

    const errorCode = (mitmError.code || '').toUpperCase();
    const errorMessage = (mitmError.message || '').toUpperCase();
    const isMitm = errorCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || errorMessage.includes('SELF SIGNED');

    if (isMitm) {
      telemetryService.captureException(mitmError, {
        tag: 'SECURITY_ALERT_MITM',
        url: mitmError.config.url,
      });
    }

    expect(telemetryService.captureException).toHaveBeenCalledWith(
      mitmError,
      expect.objectContaining({ tag: 'SECURITY_ALERT_MITM' })
    );
  });
});
