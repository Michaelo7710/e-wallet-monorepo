import axios from 'axios';
import api, { AppError, isPublicEndpoint, STORAGE_KEYS } from '../src/core/network/api';
import { secureStorageService } from '../src/core/security/secureStorage.service';
import { useAuthStore } from '../src/core/storage/useAuthStore';

jest.mock('../src/core/config/env', () => ({
  ENV: {
    MODE: 'local',
    API_URL: 'http://127.0.0.1:3000/api/v1',
    IS_DEV: true,
    IS_PROD: false,
  },
}));

jest.mock('../src/core/security/biometrics.service', () => ({
  BiometricsService: {
    isAvailable: jest.fn(),
    authenticate: jest.fn(),
  },
}));

jest.mock('../src/core/di/container', () => ({
  userLocalDataSource: { clearProfile: jest.fn() },
  paymentLocalDataSource: { clearAll: jest.fn() },
}));

jest.mock('../src/core/security/secureStorage.service', () => ({
  secureStorageService: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clearSession: jest.fn(),
  },
}));

describe('TASK-B3-HOTFIX-01: Token Destructuring Synchronization & Refresh Token Interceptor', () => {
  let axiosPostSpy: jest.SpyInstance;
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    jest.clearAllMocks();
    axiosPostSpy = jest.spyOn(axios, 'post');
    api.defaults.adapter = jest.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
      data: { status: 'success', message: 'Resource loaded' },
    }) as any;
  });

  afterEach(() => {
    axiosPostSpy.mockRestore();
    api.defaults.adapter = originalAdapter;
  });

  it('1. Harus sukses mengekstrak newAccessToken dari format standar backend { status: "success", data: { access_token: ... } }', async () => {
    const mockRefreshToken = 'valid-refresh-token-123';
    const expectedNewToken = 'new-access-token-from-data-nesting';

    (secureStorageService.getItem as jest.Mock).mockResolvedValue(mockRefreshToken);
    axiosPostSpy.mockResolvedValueOnce({
      status: 200,
      headers: { 'x-correlation-id': 'corr-refresh-test-01' },
      data: {
        status: 'success',
        message: 'Access Token baru berhasil diterbitkan.',
        data: {
          access_token: expectedNewToken,
        },
      },
    });

    const responseInterceptor = (api.interceptors.response as any).handlers[0].rejected;

    const error401 = {
      response: { status: 401 },
      config: {
        url: '/users/profile',
        headers: {},
      },
    };

    await responseInterceptor(error401);

    expect(secureStorageService.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.ACCESS_TOKEN,
      expectedNewToken
    );
    expect(useAuthStore.getState().token).toBe(expectedNewToken);
  });

  it('2. Harus sukses mengekstrak newAccessToken secara defensive dari level root { access_token: ... }', async () => {
    const mockRefreshToken = 'valid-refresh-token-456';
    const expectedNewToken = 'new-access-token-from-root-key';

    (secureStorageService.getItem as jest.Mock).mockResolvedValue(mockRefreshToken);
    axiosPostSpy.mockResolvedValueOnce({
      status: 200,
      headers: {},
      data: {
        status: 'success',
        access_token: expectedNewToken,
      },
    });

    const responseInterceptor = (api.interceptors.response as any).handlers[0].rejected;

    const error401 = {
      response: { status: 401 },
      config: {
        url: '/wallet/balance',
        headers: {},
      },
    };

    await responseInterceptor(error401);

    expect(secureStorageService.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.ACCESS_TOKEN,
      expectedNewToken
    );
    expect(useAuthStore.getState().token).toBe(expectedNewToken);
  });

  it('3. Harus sukses mengekstrak newAccessToken secara defensive dari legacy key { token: ... }', async () => {
    const mockRefreshToken = 'valid-refresh-token-789';
    const expectedNewToken = 'new-access-token-from-legacy-token-key';

    (secureStorageService.getItem as jest.Mock).mockResolvedValue(mockRefreshToken);
    axiosPostSpy.mockResolvedValueOnce({
      status: 200,
      headers: {},
      data: {
        token: expectedNewToken,
      },
    });

    const responseInterceptor = (api.interceptors.response as any).handlers[0].rejected;

    const error401 = {
      response: { status: 401 },
      config: {
        url: '/payments/history',
        headers: {},
      },
    };

    await responseInterceptor(error401);

    expect(secureStorageService.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.ACCESS_TOKEN,
      expectedNewToken
    );
    expect(useAuthStore.getState().token).toBe(expectedNewToken);
  });

  it('4. Harus menolak jika token tidak ditemukan pada payload dan menjalankan logoutSession() tanpa unhandled rejection', async () => {
    (secureStorageService.getItem as jest.Mock).mockResolvedValue('valid-refresh-token');
    axiosPostSpy.mockResolvedValueOnce({
      status: 200,
      headers: {},
      data: {
        status: 'success',
        data: {}, // Kosong, tidak ada token
      },
    });

    const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logoutSession').mockResolvedValue();

    const responseInterceptor = (api.interceptors.response as any).handlers[0].rejected;

    const error401 = {
      response: { status: 401 },
      config: {
        url: '/payments/history',
        headers: {},
      },
    };

    await expect(responseInterceptor(error401)).rejects.toThrow(
      'Respon refresh token tidak valid: payload access_token kosong.'
    );

    expect(logoutSpy).toHaveBeenCalled();
    logoutSpy.mockRestore();
  });

  it('5. Harus memicu logoutSession dan menolak request jika API refresh-token mengembalikan error 401/500', async () => {
    (secureStorageService.getItem as jest.Mock).mockResolvedValue('expired-refresh-token');
    axiosPostSpy.mockRejectedValueOnce(new Error('Refresh Token Kedaluwarsa (401)'));

    const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logoutSession').mockResolvedValue();

    const responseInterceptor = (api.interceptors.response as any).handlers[0].rejected;

    const error401 = {
      response: { status: 401 },
      config: {
        url: '/users/profile',
        headers: {},
      },
    };

    await expect(responseInterceptor(error401)).rejects.toThrow('Refresh Token Kedaluwarsa (401)');
    expect(logoutSpy).toHaveBeenCalled();
    logoutSpy.mockRestore();
  });
});

describe('TASK-FIX-INTERCEPTOR-01: Whitelist Public Endpoints & Error Transparency', () => {
  let axiosPostSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    axiosPostSpy = jest.spyOn(axios, 'post');
  });

  afterEach(() => {
    axiosPostSpy.mockRestore();
  });

  it('1. isPublicEndpoint harus mengidentifikasi rute publik dengan tepat', () => {
    expect(isPublicEndpoint('/auth/login')).toBe(true);
    expect(isPublicEndpoint('/auth/register')).toBe(true);
    expect(isPublicEndpoint('/auth/verify-email')).toBe(true);
    expect(isPublicEndpoint('/auth/resend-otp')).toBe(true);
    expect(isPublicEndpoint('/auth/2fa/login-verify')).toBe(true);
    expect(isPublicEndpoint('/auth/2fa/verify-login')).toBe(true);
    expect(isPublicEndpoint('/auth/forgot-password')).toBe(true);
    expect(isPublicEndpoint('/auth/reset-password')).toBe(true);
    expect(isPublicEndpoint('/config/feature-flags')).toBe(true);
    expect(isPublicEndpoint('https://api.domain.com/auth/register?lang=id')).toBe(true);

    expect(isPublicEndpoint('/users/profile')).toBe(false);
    expect(isPublicEndpoint('/wallet/balance')).toBe(false);
    expect(isPublicEndpoint('/payments/topup')).toBe(false);
    expect(isPublicEndpoint(undefined)).toBe(false);
  });

  it('2. Harus meneruskan error asli server pada endpoint publik (/auth/register) saat 401 tanpa memicu refresh token', async () => {
    const responseInterceptor = (api.interceptors.response as any).handlers[0].rejected;
    const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logoutSession').mockResolvedValue();

    const publicError401 = {
      response: {
        status: 401,
        data: {
          status: 'fail',
          message: 'Akses Ditolak: Kredensial tidak valid',
        },
      },
      config: {
        url: '/auth/register',
        method: 'post',
        headers: {},
      },
    };

    await expect(responseInterceptor(publicError401)).rejects.toEqual(publicError401);

    expect(secureStorageService.getItem).not.toHaveBeenCalled();
    expect(axiosPostSpy).not.toHaveBeenCalled();
    expect(logoutSpy).not.toHaveBeenCalled();

    logoutSpy.mockRestore();
  });

  it('3. Harus meneruskan error asli server pada /config/feature-flags saat 401 tanpa refresh token', async () => {
    const responseInterceptor = (api.interceptors.response as any).handlers[0].rejected;
    const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logoutSession').mockResolvedValue();

    const featureFlagsError401 = {
      response: {
        status: 401,
        data: {
          status: 'error',
          message: 'Deployment Protection Active',
        },
      },
      config: {
        url: '/config/feature-flags',
        method: 'get',
        headers: {},
      },
    };

    await expect(responseInterceptor(featureFlagsError401)).rejects.toEqual(featureFlagsError401);

    expect(secureStorageService.getItem).not.toHaveBeenCalled();
    expect(axiosPostSpy).not.toHaveBeenCalled();
    expect(logoutSpy).not.toHaveBeenCalled();

    logoutSpy.mockRestore();
  });

  it('4. Harus menolak dengan AppError dan memicu logoutSession pada rute terlindungi jika refresh token tidak tersedia', async () => {
    (secureStorageService.getItem as jest.Mock).mockResolvedValue(null);
    const logoutSpy = jest.spyOn(useAuthStore.getState(), 'logoutSession').mockResolvedValue();

    const responseInterceptor = (api.interceptors.response as any).handlers[0].rejected;

    const protectedError401 = {
      response: { status: 401 },
      config: {
        url: '/users/profile',
        method: 'get',
        headers: {},
      },
    };

    let thrownError: any = null;
    try {
      await responseInterceptor(protectedError401);
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(AppError);
    expect(thrownError.message).toBe('Refresh token tidak tersedia.');
    expect(thrownError.statusCode).toBe(401);
    expect(thrownError.errorCode).toBe('REFRESH_TOKEN_NOT_FOUND');
    expect(logoutSpy).toHaveBeenCalled();
    expect(axiosPostSpy).not.toHaveBeenCalled();

    logoutSpy.mockRestore();
  });
});

