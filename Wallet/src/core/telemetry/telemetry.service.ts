/**
 * GreenPay Telemetry & Observability Service
 * 
 * Abstraksi telemetri sentral untuk aplikasi mobile dengan fitur:
 * - Manajemen Correlation ID (Distributed Tracing dari Backend)
 * - Ring Buffer Breadcrumbs (Pelacakan alur interaksi pengguna & status jaringan)
 * - Laporan Diagnostik Exception Terstruktur & Ter-sanitize
 */

import { sanitizePayload } from './piiSanitizer';

export interface Breadcrumb {
  category: 'network' | 'ui' | 'navigation' | 'auth';
  message: string;
  level?: 'info' | 'warn' | 'error';
  data?: Record<string, any>;
  timestamp?: number;
}

export interface ExceptionReport {
  errorName: string;
  message: string;
  stack: string;
  correlationId: string | null;
  breadcrumbs: Breadcrumb[];
  context?: Record<string, any>;
  timestamp: string;
}

class TelemetryService {
  private static instance: TelemetryService;
  private currentCorrelationId: string | null = null;
  private breadcrumbsQueue: Breadcrumb[] = [];
  private readonly MAX_BREADCRUMBS = 20;

  private constructor() {}

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  /**
   * Perbarui Correlation ID aktif (biasanya diperoleh dari header X-Correlation-ID backend)
   */
  public setCorrelationId(id: string): void {
    if (id && typeof id === 'string') {
      this.currentCorrelationId = id.trim();
    }
  }

  /**
   * Ambil Correlation ID aktif saat ini
   */
  public getCorrelationId(): string | null {
    return this.currentCorrelationId;
  }

  /**
   * Tambahkan breadcrumb jejak navigasi, aksi UI, jaringan, atau otentikasi.
   * Data secara otomatis disanitasi dari PII sebelum disimpan dalam antrean Ring Buffer.
   */
  public addBreadcrumb(crumb: Omit<Breadcrumb, 'timestamp'>): void {
    const sanitizedData = crumb.data ? sanitizePayload(crumb.data) : undefined;

    const newBreadcrumb: Breadcrumb = {
      ...crumb,
      data: sanitizedData,
      timestamp: Date.now(),
    };

    this.breadcrumbsQueue.push(newBreadcrumb);

    // Ring Buffer: Buang jejak tertua jika melebihi batas kapasitas maksimal (20 item)
    if (this.breadcrumbsQueue.length > this.MAX_BREADCRUMBS) {
      this.breadcrumbsQueue.shift();
    }
  }

  /**
   * Catat exception/crash dan tampilkan laporan diagnostik terstruktur.
   * Siap diintegrasikan ke adapter eksternal (misal Sentry / Firebase Crashlytics).
   */
  public captureException(error: Error | any, customContext?: Record<string, any>): void {
    const errorName = error?.name || 'UnknownError';
    const message = error?.message || String(error);
    const stack = error?.stack || 'No stack trace available';
    const sanitizedContext = customContext ? sanitizePayload(customContext) : undefined;

    const report: ExceptionReport = {
      errorName,
      message,
      stack,
      correlationId: this.currentCorrelationId,
      breadcrumbs: [...this.breadcrumbsQueue],
      context: sanitizedContext,
      timestamp: new Date().toISOString(),
    };

    console.error('🚨 [TELEMETRY EXCEPTION REPORT]:\n', JSON.stringify(report, null, 2));

    // Ekstensi Hook: Dispatch ke Sentry / Datadog / Crashlytics jika terpasang
    // if (typeof Sentry !== 'undefined') { ... }
  }

  /**
   * Rekam pesan diagnostik umum atau catatan penting ke telemetri
   */
  public captureMessage(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    this.addBreadcrumb({
      category: 'ui',
      message,
      level,
    });

    const formattedLog = `📊 [TELEMETRY ${level.toUpperCase()}]: ${message} (Correlation-ID: ${this.currentCorrelationId || 'N/A'})`;

    if (level === 'error') {
      console.error(formattedLog);
    } else if (level === 'warn') {
      console.warn(formattedLog);
    } else {
      console.log(formattedLog);
    }
  }

  /**
   * Ambil salinan seluruh breadcrumbs saat ini (untuk keperluan inspeksi atau tes)
   */
  public getBreadcrumbs(): ReadonlyArray<Breadcrumb> {
    return [...this.breadcrumbsQueue];
  }

  /**
   * Bersihkan riwayat antrean breadcrumbs (misal saat logout sesi)
   */
  public clearBreadcrumbs(): void {
    this.breadcrumbsQueue = [];
  }
}

export const telemetryService = TelemetryService.getInstance();
