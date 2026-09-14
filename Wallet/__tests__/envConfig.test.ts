jest.mock('expo/virtual/env', () => ({
  env: process.env,
}));

describe('Environment Configuration Engine', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should default to local mode and resolve fallback local API URL with 192.168.43.20', () => {
    delete process.env.EXPO_PUBLIC_ENV_MODE;
    delete process.env.EXPO_PUBLIC_API_URL;

    const { ENV, ACTIVE_MODE } = require('../src/core/config/env');

    expect(ACTIVE_MODE).toBe('local');
    expect(ENV.API_URL).toBe('http://192.168.43.20:3000/api/v1');
    expect(ENV.IS_DEV).toBe(true);
    expect(ENV.IS_PROD).toBe(false);
  });

  it('should read EXPO_PUBLIC_API_URL directly from environment', () => {
    process.env.EXPO_PUBLIC_ENV_MODE = 'local';
    process.env.EXPO_PUBLIC_API_URL = 'http://192.168.43.20:3000/api/v1';

    const { ENV, ACTIVE_MODE } = require('../src/core/config/env');

    expect(ACTIVE_MODE).toBe('local');
    expect(ENV.API_URL).toBe('http://192.168.43.20:3000/api/v1');
    expect(ENV.IS_DEV).toBe(true);
    expect(ENV.IS_PROD).toBe(false);
  });

  it('should resolve ngrok mode fallback correctly when EXPO_PUBLIC_API_URL is missing', () => {
    process.env.EXPO_PUBLIC_ENV_MODE = 'ngrok';
    delete process.env.EXPO_PUBLIC_API_URL;

    const { ENV, ACTIVE_MODE } = require('../src/core/config/env');

    expect(ACTIVE_MODE).toBe('ngrok');
    expect(ENV.API_URL).toBe('https://irritative-yuriko-knolly.ngrok-free.dev/api/v1');
    expect(ENV.IS_DEV).toBe(true);
    expect(ENV.IS_PROD).toBe(false);
  });

  it('should resolve vercel mode fallback correctly and mark as production', () => {
    process.env.EXPO_PUBLIC_ENV_MODE = 'vercel';
    delete process.env.EXPO_PUBLIC_API_URL;

    const { ENV, ACTIVE_MODE } = require('../src/core/config/env');

    expect(ACTIVE_MODE).toBe('vercel');
    expect(ENV.API_URL).toBe('https://e-wallet-monorepo-ohi0qz3xs-dev-mich.vercel.app/api/v1');
    expect(ENV.IS_DEV).toBe(false);
    expect(ENV.IS_PROD).toBe(true);
  });

  it('should allow custom EXPO_PUBLIC_API_URL in ngrok mode', () => {
    process.env.EXPO_PUBLIC_ENV_MODE = 'ngrok';
    process.env.EXPO_PUBLIC_API_URL = 'https://custom-tunnel.ngrok-free.dev/api/v1';

    const { ENV, ACTIVE_MODE } = require('../src/core/config/env');

    expect(ACTIVE_MODE).toBe('ngrok');
    expect(ENV.API_URL).toBe('https://custom-tunnel.ngrok-free.dev/api/v1');
    expect(ENV.IS_DEV).toBe(true);
    expect(ENV.IS_PROD).toBe(false);
  });

  it('should fallback to emergency URL if EXPO_PUBLIC_API_URL is invalid', () => {
    process.env.EXPO_PUBLIC_ENV_MODE = 'local';
    process.env.EXPO_PUBLIC_API_URL = 'invalid-url';

    const { ENV } = require('../src/core/config/env');

    expect(ENV.API_URL).toBe('http://192.168.43.20:3000/api/v1');
  });
});
