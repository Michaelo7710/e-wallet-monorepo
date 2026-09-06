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

const api = axios.create({
  baseURL: ENV.API_URL,
  timeout: 10000,
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

    // C. Rekam Breadcrumb Request Jaringan (otomatis disanitasi dari PII)
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
    telemetryService.addBreadcrumb({
      category: 'network',
      level: 'info',
      message: `HTTP ${response.status} ${response.config.url || ''}`,
      data: {
        status: response.status,
        url: response.config.url,
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

    if (isMitmIncident) {
      telemetryService.captureException(error, {
        tag: 'SECURITY_ALERT_MITM',
        url: error.config?.url,
        code: error.code,
        message: error.message,
      });
    }

    // C. Rekam Breadcrumb HTTP Error
    telemetryService.addBreadcrumb({
      category: 'network',
      level: 'error',
      message: `HTTP Error ${error.response?.status || 'Network Error'} ${error.config?.url || ''}`,
      data: {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        response: error.response?.data,
      },
    });

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login')
    ) {
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
          throw new Error('Refresh Token tidak tersedia.');
        }

        const response = await axios.post(`${ENV.API_URL}/auth/refresh-token`, {
          refresh_token: refreshToken,
        });

        const refreshCorrelationId =
          response.headers?.['x-correlation-id'] || response.headers?.['X-Correlation-ID'];
        if (refreshCorrelationId && typeof refreshCorrelationId === 'string') {
          telemetryService.setCorrelationId(refreshCorrelationId);
        }

        const { token: newAccessToken } = response.data;

        await secureStorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        useAuthStore.getState().setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await useAuthStore.getState().logoutSession();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;