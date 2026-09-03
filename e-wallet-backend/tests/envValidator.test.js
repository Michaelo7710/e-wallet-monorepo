const { validateEnv, getEnv } = require('../src/config/envValidator');

describe('Fail-Fast Environment Schema Validator', () => {
  const validEnvTemplate = {
    NODE_ENV: 'test',
    PORT: '3000',
    DATABASE_URL: 'mongodb://127.0.0.1:27017/test_db',
    JWT_SECRET: 'super-secret-jwt-key-minimum-32-chars-long',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_SECRET: 'super-secret-refresh-key-minimum-32-chars-long',
    JWT_REFRESH_EXPIRES_IN: '7d',
    JWT_PRE_AUTH_SECRET: 'super-secret-pre-auth-key-minimum-32-chars-long',
    JWT_PRE_AUTH_EXPIRES_IN: '3m',
    MIDTRANS_SERVER_KEY: 'Mid-server-valid-test-key-12345',
    MIDTRANS_CLIENT_KEY: 'Mid-client-valid-test-key-12345',
    MIDTRANS_IS_PRODUCTION: 'false',
    EMAIL_HOST: 'sandbox.smtp.mailtrap.io',
    EMAIL_PORT: '2525',
    EMAIL_USER: 'test-user',
    EMAIL_PASS: 'test-password',
    USE_TRANSACTIONS: 'false',
    TOTP_WINDOW_STEPS: '1',
  };

  it('harus berhasil memvalidasi dan membekukan objek ENV dengan konfigurasi valid', () => {
    const env = validateEnv({
      customEnv: { ...validEnvTemplate },
      exitOnError: false,
      forceReload: true,
      silent: true,
    });

    expect(env).toBeDefined();
    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe(3000);
    expect(env.IS_TEST).toBe(true);
    expect(env.IS_DEVELOPMENT).toBe(false);
    expect(env.IS_PRODUCTION).toBe(false);
    expect(env.DATABASE_URL).toBe('mongodb://127.0.0.1:27017/test_db');
    expect(env.MIDTRANS_IS_PRODUCTION).toBe(false);
    expect(env.USE_TRANSACTIONS).toBe(false);
    expect(Object.isFrozen(env)).toBe(true);
  });

  it('harus menolak modifikasi properti (Object.freeze protection)', () => {
    const env = validateEnv({
      customEnv: { ...validEnvTemplate },
      exitOnError: false,
      forceReload: true,
      silent: true,
    });

    expect(() => {
      'use strict';
      env.PORT = 8080;
    }).toThrow();
  });

  it('harus menangkap error jika JWT_REFRESH_SECRET hilang', () => {
    const customEnv = { ...validEnvTemplate };
    delete customEnv.JWT_REFRESH_SECRET;

    expect(() => {
      validateEnv({
        customEnv,
        exitOnError: false,
        forceReload: true,
        silent: true,
      });
    }).toThrow(/JWT_REFRESH_SECRET: Variabel wajib diisi/);
  });

  it('harus menangkap error jika JWT_PRE_AUTH_SECRET hilang', () => {
    const customEnv = { ...validEnvTemplate };
    delete customEnv.JWT_PRE_AUTH_SECRET;

    expect(() => {
      validateEnv({
        customEnv,
        exitOnError: false,
        forceReload: true,
        silent: true,
      });
    }).toThrow(/JWT_PRE_AUTH_SECRET: Variabel wajib diisi/);
  });

  it('harus menolak JWT_SECRET jika kurang dari 16 karakter', () => {
    const customEnv = { ...validEnvTemplate, JWT_SECRET: 'short_secret' };

    expect(() => {
      validateEnv({
        customEnv,
        exitOnError: false,
        forceReload: true,
        silent: true,
      });
    }).toThrow(/JWT_SECRET: Panjang rahasia minimal 16 karakter/);
  });

  it('harus menolak PORT jika bukan bilangan bulat positif valid', () => {
    const customEnv = { ...validEnvTemplate, PORT: 'invalid_port' };

    expect(() => {
      validateEnv({
        customEnv,
        exitOnError: false,
        forceReload: true,
        silent: true,
      });
    }).toThrow(/PORT: Harus berupa bilangan bulat positif/);
  });

  it('harus menolak NODE_ENV jika bukan salah satu dari development, production, test', () => {
    const customEnv = { ...validEnvTemplate, NODE_ENV: 'staging' };

    expect(() => {
      validateEnv({
        customEnv,
        exitOnError: false,
        forceReload: true,
        silent: true,
      });
    }).toThrow(/NODE_ENV: Nilai tidak valid/);
  });

  it('harus menolak DATABASE_URL jika kosong atau berformat tidak valid', () => {
    const customEnv = { ...validEnvTemplate, DATABASE_URL: 'invalid-db-url' };

    expect(() => {
      validateEnv({
        customEnv,
        exitOnError: false,
        forceReload: true,
        silent: true,
      });
    }).toThrow(/DATABASE_URL: Format URL tidak valid/);
  });

  it('harus menolak MIDTRANS_IS_PRODUCTION jika bukan boolean string (true/false)', () => {
    const customEnv = { ...validEnvTemplate, MIDTRANS_IS_PRODUCTION: 'yes' };

    expect(() => {
      validateEnv({
        customEnv,
        exitOnError: false,
        forceReload: true,
        silent: true,
      });
    }).toThrow(/MIDTRANS_IS_PRODUCTION: Harus berupa string boolean/);
  });

  it('harus mengembalikan objek yang sama melalui getEnv()', () => {
    const env = getEnv();
    expect(env).toBeDefined();
    expect(typeof env).toBe('object');
  });
});
