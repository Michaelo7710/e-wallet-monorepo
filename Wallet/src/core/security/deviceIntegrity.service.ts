/**
 * GreenPay Device Integrity Guard
 * 
 * Bertanggung jawab melakukan deteksi dini terhadap:
 * 1. Rooting (Android) & Jailbreak (iOS) Binaries
 * 2. Runtime Injection & Dynamic Instrumentation (Frida / Xposed)
 * 3. Custom ROM Tidak Resmi (Test-Keys Build Tags)
 * 4. Runtime Emulator Enforcement (Zero-Tolerance di Production)
 */

import { Platform } from 'react-native';
import { ENV } from '@core/config/env';

export interface DeviceIntegrityResult {
  isCompromised: boolean;
  reasons: string[];
  isEmulator: boolean;
}

export interface CheckIntegrityOptions {
  allowEmulatorInDev?: boolean;
}

export const ROOT_JAILBREAK_PATHS = [
  '/system/bin/su',
  '/system/xbin/su',
  '/sbin/su',
  '/system/app/Superuser.apk',
  '/data/local/bin/su',
  '/Library/MobileSubstrate/MobileSubstrate.dylib',
  '/bin/bash',
  '/usr/sbin/sshd',
  '/etc/apt',
] as const;

export class DeviceIntegrityService {
  private static instance: DeviceIntegrityService;
  private mockOverride: DeviceIntegrityResult | null = null;

  private constructor() {}

  public static getInstance(): DeviceIntegrityService {
    if (!DeviceIntegrityService.instance) {
      DeviceIntegrityService.instance = new DeviceIntegrityService();
    }
    return DeviceIntegrityService.instance;
  }

  /**
   * Mengatur mock hasil pemeriksaan integritas untuk testing dan verifikasi QA
   */
  public setMockOverride(override: DeviceIntegrityResult | null): void {
    this.mockOverride = override;
  }

  /**
   * Memeriksa keberadaan jejak berkas biner Root / Jailbreak
   */
  private checkRootJailbreakBinaries(): string[] {
    const reasons: string[] = [];
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
    const mockPaths: string[] = g.__mockCompromisedPaths || [];

    // Periksa mock registry jalur berbahaya
    for (const path of ROOT_JAILBREAK_PATHS) {
      if (mockPaths.includes(path)) {
        reasons.push(`Terdeteksi biner sistem berbahaya: ${path}`);
      }
    }

    // Jika di lingkungan dengan akses fs (e.g. native bridge atau test runner)
    try {
      const fs = typeof require !== 'undefined' ? require('fs') : null;
      if (fs && typeof fs.existsSync === 'function') {
        for (const path of ROOT_JAILBREAK_PATHS) {
          try {
            if (fs.existsSync(path)) {
              reasons.push(`Terdeteksi biner sistem berbahaya: ${path}`);
            }
          } catch {
            // Abaikan kesalahan akses izin
          }
        }
      }
    } catch {
      // Abaikan jika fs tidak tersedia
    }

    return reasons;
  }

  /**
   * Memeriksa objek injeksi Frida dan hook runtime
   */
  private checkFridaAndRuntimeHooks(): string[] {
    const reasons: string[] = [];
    const g = typeof globalThis !== 'undefined' ? (globalThis as any) : {};
    const w = g.window || {};

    const hasFridaGlobal = Boolean(
      g.frida ||
      g._frida ||
      g.Frida ||
      g.__frida_agent ||
      w.frida ||
      w._frida ||
      w.Frida ||
      w.__frida_agent
    );

    if (hasFridaGlobal) {
      reasons.push('Terdeteksi injeksi runtime instrumen dinamis (Frida/Xposed).');
    }

    // Periksa properti global yang mencurigakan
    try {
      const globalKeys = Object.keys(g);
      const suspiciousKey = globalKeys.find(
        (key) =>
          key.toLowerCase().includes('frida') ||
          key.toLowerCase().includes('xposed') ||
          key.toLowerCase().includes('cydia')
      );
      if (suspiciousKey && !hasFridaGlobal) {
        reasons.push(`Terdeteksi jejak manipulasi memori runtime: ${suspiciousKey}`);
      }
    } catch {
      // Abaikan jika Object.keys dibatasi
    }

    return reasons;
  }

  /**
   * Memeriksa tag build test-keys yang menandakan Custom ROM tidak resmi
   */
  private checkTestKeysBuildTags(): string[] {
    const reasons: string[] = [];
    const constants = (Platform.constants || {}) as any;
    const fingerprint = (constants.Fingerprint || '').toLowerCase();
    const tags = (constants.Tags || '').toLowerCase();

    if (fingerprint.includes('test-keys') || tags.includes('test-keys')) {
      reasons.push('Terdeteksi build firmware tidak resmi (test-keys build tags).');
    }

    return reasons;
  }

  /**
   * Memeriksa apakah aplikasi berjalan di atas simulator atau emulator
   */
  public isEmulator(): boolean {
    const constants = (Platform.constants || {}) as any;

    if (Platform.OS === 'android') {
      const fingerprint = (constants.Fingerprint || '').toLowerCase();
      const model = (constants.Model || '').toLowerCase();
      const manufacturer = (constants.Manufacturer || '').toLowerCase();
      const brand = (constants.Brand || '').toLowerCase();
      const hardware = (constants.Hardware || '').toLowerCase();
      const product = (constants.Product || '').toLowerCase();

      return (
        fingerprint.startsWith('generic') ||
        fingerprint.startsWith('unknown') ||
        model.includes('google_sdk') ||
        model.includes('emulator') ||
        model.includes('android sdk built for') ||
        manufacturer.includes('genymotion') ||
        brand.startsWith('generic') ||
        hardware.includes('goldfish') ||
        hardware.includes('ranchu') ||
        hardware.includes('vbox86') ||
        product.includes('sdk') ||
        product.includes('google_sdk')
      );
    }

    if (Platform.OS === 'ios') {
      // Di iOS Simulator, interfaceIdiom / forceTouchAvailable / systemName
      return constants.forceTouchAvailable === false && !constants.interfaceIdiom;
    }

    return false;
  }

  /**
   * Melakukan pemeriksaan menyeluruh integritas perangkat
   */
  public async checkDeviceIntegrity(
    options: CheckIntegrityOptions = {}
  ): Promise<DeviceIntegrityResult> {
    if (this.mockOverride) {
      return this.mockOverride;
    }

    const allowEmulatorInDev = options.allowEmulatorInDev ?? true;
    const reasons: string[] = [];

    // 1. Deteksi Root / Jailbreak Binaries
    const rootReasons = this.checkRootJailbreakBinaries();
    reasons.push(...rootReasons);

    // 2. Deteksi Frida & Runtime Hooks
    const fridaReasons = this.checkFridaAndRuntimeHooks();
    reasons.push(...fridaReasons);

    // 3. Deteksi Test-Keys Build Tags
    const testKeysReasons = this.checkTestKeysBuildTags();
    reasons.push(...testKeysReasons);

    // 4. Deteksi Emulator
    const emulatorDetected = this.isEmulator();

    // Evaluasi Lingkungan:
    // - Jika IS_PROD = true, kebijakan Zero-Tolerance: emulator dilarang di production
    if (ENV.IS_PROD && emulatorDetected) {
      reasons.push('Penggunaan emulator diblokir pada lingkungan produksi demi keamanan nasabah.');
    }

    // Jika IS_DEV = true dan allowEmulatorInDev = true, emulator tidak dianggap compromised
    const isRootOrHookCompromised =
      rootReasons.length > 0 || fridaReasons.length > 0 || testKeysReasons.length > 0;

    let isCompromised = false;
    if (ENV.IS_PROD) {
      isCompromised = isRootOrHookCompromised || emulatorDetected;
    } else {
      // Mode Development: Hanya diblokir jika ada root / frida hook / test-keys
      isCompromised = isRootOrHookCompromised || (!allowEmulatorInDev && emulatorDetected);
    }

    return {
      isCompromised,
      reasons,
      isEmulator: emulatorDetected,
    };
  }
}

export const deviceIntegrityService = DeviceIntegrityService.getInstance();
