const { Writable } = require('stream');
const request = require('supertest');
const pino = require('pino');
const app = require('../app');
const logger = require('../src/utils/logger');

describe('TASK-B2-07: Structured Logging, Correlation ID & PII Masking', () => {
  it('harus menyematkan X-Correlation-ID berformat UUID v4 pada setiap response keluar', async () => {
    const res = await request(app).get('/');

    expect(res.statusCode).toBe(200);
    expect(res.headers['x-correlation-id']).toBeDefined();
    // Validasi format UUID v4: 8-4-4-4-12 hex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(res.headers['x-correlation-id']).toMatch(uuidRegex);
  });

  it('harus mempertahankan X-Correlation-ID yang dikirim dari klien/upstream', async () => {
    const customCorrelationId = 'client-tracer-id-abc-12345';
    const res = await request(app)
      .get('/')
      .set('X-Correlation-ID', customCorrelationId);

    expect(res.statusCode).toBe(200);
    expect(res.headers['x-correlation-id']).toBe(customCorrelationId);
  });

  it('harus menyertakan correlation_id pada response JSON saat terjadi error', async () => {
    const customCorrelationId = 'error-trace-xyz-98765';
    const res = await request(app)
      .get('/api/v1/non-existent-route-for-testing')
      .set('X-Correlation-ID', customCorrelationId);

    expect(res.statusCode).toBe(404);
    expect(res.body.correlation_id).toBe(customCorrelationId);
    expect(res.headers['x-correlation-id']).toBe(customCorrelationId);
  });

  it('harus menyensor otomatis seluruh data sensitif (PII) dengan [REDACTED]', () => {
    const loggedMessages = [];
    const captureStream = new Writable({
      write(chunk, encoding, callback) {
        try {
          const parsed = JSON.parse(chunk.toString());
          loggedMessages.push(parsed);
        } catch {
          // Abaikan jika bukan JSON
        }
        callback();
      },
    });

    // Gunakan pinoOptions produksi yang sama dengan instance singleton
    const testLogger = pino({ ...logger.pinoOptions, level: 'info' }, captureStream);

    const sensitiveData = {
      password: 'PlainSecretPassword123!',
      pin: '123456',
      old_password: 'OldPassword123!',
      new_password: 'NewPassword123!',
      confirm_new_password: 'NewPassword123!',
      old_pin: '111111',
      new_pin: '222222',
      confirm_new_pin: '222222',
      token: 'eyJh...sensitive_jwt_token',
      pre_auth_token: 'eyJh...pre_auth_ticket',
      refresh_token: 'eyJh...refresh_token',
      two_factor_secret: 'JBSWY3DPEHPK3PXP',
      nik: '3201234567890001',
      body: {
        password: 'NestedPassword456!',
        pin: '654321',
        nik: '3171234567890002',
      },
    };

    // Buat child logger untuk simulasi request
    const reqLogger = testLogger.child({ correlationId: 'test-pii-masking-id' });
    reqLogger.info(sensitiveData, 'Simulasi Log Sensitif PII');

    expect(loggedMessages.length).toBe(1);
    const lastLog = loggedMessages[0];

    // Verifikasi seluruh field sensitif telah di-mask menjadi [REDACTED]
    expect(lastLog.password).toBe('[REDACTED]');
    expect(lastLog.pin).toBe('[REDACTED]');
    expect(lastLog.old_password).toBe('[REDACTED]');
    expect(lastLog.new_password).toBe('[REDACTED]');
    expect(lastLog.confirm_new_password).toBe('[REDACTED]');
    expect(lastLog.old_pin).toBe('[REDACTED]');
    expect(lastLog.new_pin).toBe('[REDACTED]');
    expect(lastLog.confirm_new_pin).toBe('[REDACTED]');
    expect(lastLog.token).toBe('[REDACTED]');
    expect(lastLog.pre_auth_token).toBe('[REDACTED]');
    expect(lastLog.refresh_token).toBe('[REDACTED]');
    expect(lastLog.two_factor_secret).toBe('[REDACTED]');
    expect(lastLog.nik).toBe('[REDACTED]');

    // Verifikasi nested body juga di-mask
    expect(lastLog.body.password).toBe('[REDACTED]');
    expect(lastLog.body.pin).toBe('[REDACTED]');
    expect(lastLog.body.nik).toBe('[REDACTED]');

    // Verifikasi metadata observability
    expect(lastLog.correlationId).toBe('test-pii-masking-id');
    expect(lastLog.level).toBe('info');
    expect(lastLog.pid).toBeDefined();
    expect(lastLog.hostname).toBeDefined();
    expect(lastLog.time).toBeDefined();
  });
});
