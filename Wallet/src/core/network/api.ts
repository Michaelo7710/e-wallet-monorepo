import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@core/storage/useAuthStore';
import { secureStorageService } from '@core/security/secureStorage.service';
import { ENV } from '@core/config/env';
import { telemetryService } from '@core/telemetry/telemetry.service';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'gp_access_token',
  REFRESH_TOKEN: 'gp_refresh_token',
  USER_DATA: 'gp_user_data',
  BIOMETRICS_ENABLED: 'gp_biometrics_enabled',
} as const;

export class AppError extends Error {
  public statusCode?: number;
  public errorCode?: string;
  public isOperational: boolean;

  constructor(message: string, statusCode = 400, errorCode = 'APP_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-otp',
  '/auth/2fa/login-verify',
  '/auth/2fa/verify-login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/config/feature-flags',
];

export const isPublicEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Interceptor Request: Injeksi Access Token, Correlation ID, Keamanan Host & Breadcrumbs
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // A. Validasi Protokol HTTPS: Tolak HTTP mentah saat mode produksi
    const targetUrl = config.url || '';
    const fullUrl = targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
      ? targetUrl
      : `${config.baseURL || ''}/${targetUrl.replace(/^\//, '')}`;

    if (ENV.IS_PROD && fullUrl.startsWith('http://')) {
      const insecureError = new Error(
        `[SECURITY] Permintaan HTTP tidak aman ditolak pada mode produksi: ${fullUrl}`
      );
      telemetryService.captureException(insecureError, {
        tag: 'SECURITY_ALERT_INSECURE_HTTP',
        url: fullUrl,
      });
      return Promise.reject(insecureError);
    }

    // B. Sematkan Header Anti-Tamper Client Integrity
    if (config.headers) {
      config.headers['X-Client-Integrity'] = 'verified';
    }

    // C. Sisipkan Correlation ID aktif ke header request keluar jika tersedia
    const activeCorrelationId = telemetryService.getCorrelationId();
    if (activeCorrelationId && config.headers) {
      config.headers['X-Correlation-ID'] = activeCorrelationId;
    }

    // D. Ambil dan sematkan Access Token
    let token = useAuthStore.getState().token;
    if (!token) {
      token = await secureStorageService.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // E. Rekam Breadcrumb Request Jaringan (otomatis disanitasi dari PII)
    telemetryService.addBreadcrumb({
      category: 'network',
      message: `HTTP ${config.method?.toUpperCase() || 'GET'} ${config.url || ''}`,
      data: {
        method: config.method,
        url: config.url,
        params: config.params,
        ...(config.data && { data: config.data }),
      },
    });

    return config;
  },
  (error) => {
    telemetryService.addBreadcrumb({
      category: 'network',
      level: 'error',
      message: `HTTP Request Configuration Error: ${error?.message || 'Unknown error'}`,
      data: { message: error?.message },
    });
    return Promise.reject(error);
  }
);

// 2. Interceptor Response: Handle Correlation ID, Breadcrumbs & Auto Refresh Token (401)
api.interceptors.response.use(
  (response) => {
    // A. Tangkap inbound X-Correlation-ID dari response header backend
    const inboundCorrelationId =
      response.headers?.['x-correlation-id'] || response.headers?.['X-Correlation-ID'];
    if (inboundCorrelationId && typeof inboundCorrelationId === 'string') {
      telemetryService.setCorrelationId(inboundCorrelationId);
    }

    // B. Rekam Breadcrumb Status HTTP Sukses
    const reqUrl = response.config.url || '';
    const reqMethod = response.config.method?.toUpperCase() || 'GET';
    telemetryService.addBreadcrumb({
      category: 'network',
      level: 'info',
      message: `HTTP ${response.status} [${reqMethod}] ${reqUrl}`,
      data: {
        status: response.status,
        url: reqUrl,
        method: reqMethod,
      },
    });

    return response;
  },
  async (error: AxiosError) => {
    // A. Tangkap X-Correlation-ID dari response header atau body saat request gagal
    const errCorrelationId =
      error.response?.headers?.['x-correlation-id'] ||
      error.response?.headers?.['X-Correlation-ID'] ||
      (error.response?.data as any)?.correlation_id;
    if (errCorrelationId && typeof errCorrelationId === 'string') {
      telemetryService.setCorrelationId(errCorrelationId);
    }

    // B. Deteksi Insiden SSL Pinning / TLS MITM Tamper
    const errorCode = (error.code || '').toUpperCase();
    const errorMessage = (error.message || '').toUpperCase();
    const isMitmIncident =
      errorCode === 'CERT_HAS_EXPIRED' ||
      errorCode === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
      errorMessage.includes('CERT_HAS_EXPIRED') ||
      errorMessage.includes('UNABLE_TO_VERIFY_LEAF_SIGNATURE') ||
      errorMessage.includes('DEPTH_ZERO_SELF_SIGNED_CERT') ||
      errorMessage.includes('SELF_SIGNED_CERT_IN_CHAIN') ||
      errorMessage.includes('SSL PINNING') ||
      errorMessage.includes('CERTIFICATE VERIFICATION FAILED') ||
      errorMessage.includes('TLS HANDSHAKE');

    const failedUrl = error.config?.url || 'unknown_url';
    const failedMethod = error.config?.method?.toUpperCase() || 'UNKNOWN_METHOD';

    if (isMitmIncident) {
      telemetryService.captureException(error, {
        tag: 'SECURITY_ALERT_MITM',
        url: failedUrl,
        code: error.code,
        message: error.message,
      });
    }

    // C. Rekam Breadcrumb HTTP Error
    telemetryService.addBreadcrumb({
      category: 'network',
      level: 'error',
      message: `HTTP Error ${error.response?.status || 'Network Error'} [${failedMethod}] ${failedUrl}`,
      data: {
        status: error.response?.status,
        url: failedUrl,
        method: failedMethod,
        message: error.message,
        response: error.response?.data,
      },
    });

    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Periksa apakah request berasal dari rute publik yang di-whitelist
      if (isPublicEndpoint(originalRequest.url)) {
        telemetryService.addBreadcrumb({
          category: 'auth',
          level: 'warn',
          message: `[AUTH_BYPASS_REFRESH] HTTP 401 pada endpoint publik: [${failedMethod}] ${failedUrl}. Meneruskan error asli ke caller.`,
          data: {
            url: failedUrl,
            method: failedMethod,
            status: 401,
          },
        });
        // Jangan lakukan auto-refresh untuk endpoint publik. Teruskan error asli server ke caller.
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await secureStorageService.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          telemetryService.addBreadcrumb({
            category: 'auth',
            level: 'warn',
            message: `[AUTH_NO_REFRESH_TOKEN] Refresh token tidak tersedia pada rute terlindungi: ${originalRequest.url}. Mengakhiri sesi.`,
            data: { url: originalRequest.url },
          });
          throw new AppError(
            'Refresh token tidak tersedia.',
            401,
            'REFRESH_TOKEN_NOT_FOUND'
          );
        }

        const response = await axios.post(`${ENV.API_URL}/auth/refresh-token`, {
          refresh_token: refreshToken,
        });

        const refreshCorrelationId =
          response.headers?.['x-correlation-id'] || response.headers?.['X-Correlation-ID'];
        if (refreshCorrelationId && typeof refreshCorrelationId === 'string') {
          telemetryService.setCorrelationId(refreshCorrelationId);
        }

        const newAccessToken =
          response.data?.data?.access_token ||
          response.data?.access_token ||
          response.data?.token;

        if (!newAccessToken || typeof newAccessToken !== 'string') {
          throw new Error('Respon refresh token tidak valid: payload access_token kosong.');
        }

        await secureStorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        useAuthStore.getState().setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        telemetryService.addBreadcrumb({
          category: 'auth',
          level: 'error',
          message: `[AUTH_REFRESH_FAILED] Gagal menyegarkan token untuk ${originalRequest.url}: ${(refreshError as any)?.message || 'Unknown error'}`,
          data: {
            url: originalRequest.url,
            error: (refreshError as any)?.message,
          },
        });
        try {
          await useAuthStore.getState().logoutSession();
        } catch (logoutError) {
          console.warn('[NETWORK] Gagal membersihkan sesi saat refresh token gagal:', logoutError);
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;