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

  it('should default to local mode and resolve local API URL with 192.168.1.100', () => {
    delete process.env.EXPO_PUBLIC_ENV_MODE;
    delete process.env.EXPO_PUBLIC_API_URL_LOCAL;
    delete process.env.EXPO_PUBLIC_API_URL;

    const { ENV, ACTIVE_MODE, ENV_PRESETS } = require('../src/core/config/env');

    expect(ACTIVE_MODE).toBe('local');
    expect(ENV_PRESETS.local).toBe('http://192.168.1.100:3000/api/v1');
    expect(ENV.API_URL).toBe('http://192.168.1.100:3000/api/v1');
    expect(ENV.IS_DEV).toBe(true);
    expect(ENV.IS_PROD).toBe(false);
  });

  it('should read EXPO_PUBLIC_API_URL_LOCAL from environment', () => {
    process.env.EXPO_PUBLIC_ENV_MODE = 'local';
    process.env.EXPO_PUBLIC_API_URL_LOCAL = 'http://192.168.1.150:3000/api/v1';

    const { ENV, ENV_PRESETS } = require('../src/core/config/env');

    expect(ENV_PRESETS.local).toBe('http://192.168.1.150:3000/api/v1');
    expect(ENV.API_URL).toBe('http://192.168.1.150:3000/api/v1');
  });

  it('should resolve ngrok mode correctly', () => {
    process.env.EXPO_PUBLIC_ENV_MODE = 'ngrok';
    process.env.EXPO_PUBLIC_API_URL_NGROK = 'https://custom-tunnel.ngrok-free.dev/api/v1';

    const { ENV, ACTIVE_MODE } = require('../src/core/config/env');

    expect(ACTIVE_MODE).toBe('ngrok');
    expect(ENV.API_URL).toBe('https://custom-tunnel.ngrok-free.dev/api/v1');
    expect(ENV.IS_DEV).toBe(true);
    expect(ENV.IS_PROD).toBe(false);
  });

  it('should resolve vercel mode correctly and mark as production', () => {
    process.env.EXPO_PUBLIC_ENV_MODE = 'vercel';
    process.env.EXPO_PUBLIC_API_URL_VERCEL = 'https://my-prod-wallet.vercel.app/api/v1';

    const { ENV, ACTIVE_MODE } = require('../src/core/config/env');

    expect(ACTIVE_MODE).toBe('vercel');
    expect(ENV.API_URL).toBe('https://my-prod-wallet.vercel.app/api/v1');
    expect(ENV.IS_DEV).toBe(false);
    expect(ENV.IS_PROD).toBe(true);
  });

  it('should allow EXPO_PUBLIC_API_URL to override preset if valid url', () => {
    process.env.EXPO_PUBLIC_ENV_MODE = 'local';
    process.env.EXPO_PUBLIC_API_URL = 'https://override-url.example.com/api/v1';

    const { ENV } = require('../src/core/config/env');

    expect(ENV.API_URL).toBe('https://override-url.example.com/api/v1');
  });
});
