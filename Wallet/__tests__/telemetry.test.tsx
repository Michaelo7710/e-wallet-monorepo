import React from 'react';
import { View, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {
  maskPhoneNumber,
  maskEmail,
  maskNik,
  sanitizePayload,
  SENSITIVE_KEYS,
} from '../src/core/telemetry/piiSanitizer';
import { telemetryService } from '../src/core/telemetry/telemetry.service';
import { GlobalErrorBoundary } from '../src/core/telemetry/GlobalErrorBoundary';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: View,
    SafeAreaProvider: View,
  };
});

describe('TASK-B2-08: PII Sanitizer Unit Tests', () => {
  it('harus menyamarkan nomor telepon sesuai format 0812****7890', () => {
    expect(maskPhoneNumber('081234567890')).toBe('0812****7890');
    expect(maskPhoneNumber('085799991234')).toBe('0857****1234');
    expect(maskPhoneNumber('')).toBe('');
    expect(maskPhoneNumber('12345')).toBe('****');
  });

  it('harus menyamarkan email sesuai format u***@domain.com', () => {
    expect(maskEmail('user@domain.com')).toBe('u***@domain.com');
    expect(maskEmail('santri@greenpay.id')).toBe('s***@greenpay.id');
    expect(maskEmail('')).toBe('');
    expect(maskEmail('invalid-email')).toBe('***@***');
  });

  it('harus menyamarkan NIK sesuai format 3201**********01', () => {
    expect(maskNik('3201234567890001')).toBe('3201**********01');
    expect(maskNik('3171999999990002')).toBe('3171**********02');
    expect(maskNik('')).toBe('');
  });

  it('harus menyensor seluruh kunci SENSITIVE_KEYS menjadi [REDACTED]', () => {
    const rawData: Record<string, string> = {};
    SENSITIVE_KEYS.forEach((key) => {
      rawData[key] = 'SecretValue123!';
    });

    const sanitized = sanitizePayload(rawData);

    SENSITIVE_KEYS.forEach((key) => {
      expect(sanitized[key]).toBe('[REDACTED]');
    });
  });

  it('harus menyamarkan email, phone, dan nik di dalam objek bersarang', () => {
    const nestedData = {
      user: {
        email: 'nasabah@bank.com',
        phone: '081299998888',
        nik: '3201123456780009',
        password: 'PlainTextPassword!',
      },
      contacts: [
        { name: 'Ahmad', user_phone: '085611112222' },
        { name: 'Budi', user_nik: '3171000000000001' },
      ],
    };

    const sanitized = sanitizePayload(nestedData);

    expect(sanitized.user.email).toBe('n***@bank.com');
    expect(sanitized.user.phone).toBe('0812****8888');
    expect(sanitized.user.nik).toBe('[REDACTED]');
    expect(sanitized.user.password).toBe('[REDACTED]');
    expect(sanitized.contacts[0].user_phone).toBe('0856****2222');
    expect(sanitized.contacts[1].user_nik).toBe('3171**********01');
  });

  it('harus membatasi rekursi maksimal 5 tingkat demi Green Computing & memory safety', () => {
    const deepObj: any = { level: 0 };
    let current = deepObj;
    for (let i = 1; i <= 8; i++) {
      current.next = { level: i };
      current = current.next;
    }

    const sanitized = sanitizePayload(deepObj);

    // Tingkat ke-6 harus dihentikan
    expect(
      sanitized.next.next.next.next.next.next
    ).toBe('[MAX_DEPTH_REACHED]');
  });
});

describe('TASK-B2-08: Telemetry Service Unit Tests', () => {
  beforeEach(() => {
    telemetryService.clearBreadcrumbs();
    telemetryService.setCorrelationId('test-init-id');
  });

  it('harus dapat menyimpan dan membaca correlation ID', () => {
    telemetryService.setCorrelationId('corr-uuid-12345');
    expect(telemetryService.getCorrelationId()).toBe('corr-uuid-12345');
  });

  it('harus membatasi antrean breadcrumbs maksimal 20 item (Ring Buffer FIFO)', () => {
    for (let i = 1; i <= 25; i++) {
      telemetryService.addBreadcrumb({
        category: 'ui',
        message: `Aksi tombol ${i}`,
        data: { step: i },
      });
    }

    const breadcrumbs = telemetryService.getBreadcrumbs();
    expect(breadcrumbs.length).toBe(20);
    // Item tertua (1-5) harus sudah terbuang, item pertama adalah langkah 6
    expect(breadcrumbs[0].data?.step).toBe(6);
    expect(breadcrumbs[19].data?.step).toBe(25);
  });

  it('harus menyaring PII pada data breadcrumbs secara otomatis', () => {
    telemetryService.addBreadcrumb({
      category: 'auth',
      message: 'User Login Attempt',
      data: {
        email: 'budi@santri.id',
        password: 'SecretPassword99!',
        pin: '123456',
        nik: '3201000000000001',
      },
    });

    const breadcrumbs = telemetryService.getBreadcrumbs();
    const lastCrumb = breadcrumbs[breadcrumbs.length - 1];

    expect(lastCrumb.data?.password).toBe('[REDACTED]');
    expect(lastCrumb.data?.pin).toBe('[REDACTED]');
    expect(lastCrumb.data?.nik).toBe('[REDACTED]');
    expect(lastCrumb.data?.email).toBe('b***@santri.id');
  });

  it('harus mencatat exception terstruktur lengkap dengan correlation ID', () => {
    const originalError = console.error;
    let capturedReport: any = null;
    console.error = (tag, reportString) => {
      if (typeof tag === 'string' && tag.includes('TELEMETRY EXCEPTION REPORT')) {
        capturedReport = JSON.parse(reportString);
      }
    };

    try {
      telemetryService.setCorrelationId('test-error-corr-id');
      telemetryService.addBreadcrumb({ category: 'navigation', message: 'Screen A -> Screen B' });

      const fakeError = new Error('Database connection timeout');
      telemetryService.captureException(fakeError, {
        screen: 'PaymentScreen',
        pin: '123456',
      });

      expect(capturedReport).toBeDefined();
      expect(capturedReport.errorName).toBe('Error');
      expect(capturedReport.message).toBe('Database connection timeout');
      expect(capturedReport.correlationId).toBe('test-error-corr-id');
      expect(capturedReport.context.screen).toBe('PaymentScreen');
      expect(capturedReport.context.pin).toBe('[REDACTED]');
      expect(capturedReport.breadcrumbs.length).toBeGreaterThan(0);
    } finally {
      console.error = originalError;
    }
  });
});

describe('TASK-B2-08: GlobalErrorBoundary Component Tests', () => {
  const GoodComponent = () => (
    <View testID="normal-view">
      <Text>Aplikasi Normal Berjalan</Text>
    </View>
  );

  beforeEach(() => {
    telemetryService.setCorrelationId('corr-screen-crash-999');
  });

  it('harus merender children normal saat tidak ada error', async () => {
    let renderer: any;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <GlobalErrorBoundary>
          <GoodComponent />
        </GlobalErrorBoundary>
      );
    });

    const root = renderer.root;
    expect(root.findByProps({ testID: 'normal-view' })).toBeDefined();
  });

  it('harus mengubah state hasError menjadi true via getDerivedStateFromError', () => {
    const error = new Error('Test Error');
    const state = GlobalErrorBoundary.getDerivedStateFromError(error);
    expect(state.hasError).toBe(true);
    expect(state.error).toBe(error);
  });

  it('harus menangkap error via componentDidCatch dan menyajikan UI fallback pemulihan', () => {
    const boundary = new GlobalErrorBoundary({ children: <GoodComponent /> });
    boundary.setState = jest.fn((newState) => {
      Object.assign(boundary.state, newState);
    });

    const testError = new Error('Simulasi Crash Render');
    boundary.componentDidCatch(testError, {
      componentStack: 'at MockComponent (mock.tsx:10:5)',
    });

    expect(boundary.setState).toHaveBeenCalledWith({
      correlationId: 'corr-screen-crash-999',
    });

    // Simulasikan state setelah error tertangkap
    boundary.state = {
      hasError: true,
      error: testError,
      correlationId: 'corr-screen-crash-999',
    };

    const rendered = boundary.render() as React.ReactElement<any>;
    expect(React.isValidElement(rendered)).toBe(true);

    const stringified = JSON.stringify(rendered);
    expect(stringified).toContain('Terjadi Kendala Sistem');
    expect(stringified).toContain('Aplikasi mengalami gangguan sementara');
    expect(stringified).toContain('corr-screen-crash-999');
    expect(stringified).toContain('Muat Ulang Aplikasi');
  });

  it('harus memulihkan state saat tombol muat ulang dieksekusi', () => {
    const onResetMock = jest.fn();
    const boundary = new GlobalErrorBoundary({ children: <GoodComponent />, onReset: onResetMock });
    boundary.state = {
      hasError: true,
      error: new Error('Crash'),
      correlationId: 'corr-123',
    };
    boundary.setState = jest.fn();

    boundary.handleReset();

    expect(boundary.setState).toHaveBeenCalledWith({
      hasError: false,
      error: null,
      correlationId: null,
    });
    expect(onResetMock).toHaveBeenCalled();
  });
});
