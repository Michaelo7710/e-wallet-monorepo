/**
 * GreenPay Feature Flags, Graceful Degradation Engine & Operational Kill-Switch
 * 
 * Sistem kontrol jarak jauh untuk menonaktifkan fitur transaksi tertentu secara dinamis
 * saat terjadi insiden partner switching, maintenance gateway, atau audit kepatuhan.
 */

import { create } from 'zustand';
import { z } from 'zod';
import api from '@core/network/api';

export type FeatureKey =
  | 'p2p_transfer'
  | 'topup_midtrans'
  | 'bank_withdrawal'
  | 'kyc_submission'
  | 'biometric_login';

export interface FeatureFlagConfig {
  enabled: boolean;
  maintenanceMessage?: string;
}

export type FeatureFlagsState = Record<FeatureKey, FeatureFlagConfig>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlagsState = {
  p2p_transfer: { enabled: true },
  topup_midtrans: { enabled: true },
  bank_withdrawal: { enabled: true },
  kyc_submission: { enabled: true },
  biometric_login: { enabled: true },
};

const featureFlagItemSchema = z.object({
  enabled: z.boolean(),
  maintenanceMessage: z.string().optional(),
});

const featureFlagsPayloadSchema = z.record(
  z.string(),
  featureFlagItemSchema
);

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 Menit (Green Computing Rate-Limiting)

interface FeatureFlagStoreState {
  flags: FeatureFlagsState;
  lastUpdated: number | null;
  isLoading: boolean;
  setFlags: (newFlags: Partial<FeatureFlagsState>) => void;
  fetchRemoteFlags: (force?: boolean) => Promise<void>;
  isFeatureEnabled: (key: FeatureKey) => boolean;
  getMaintenanceNotice: (key: FeatureKey) => string | null;
}

export const useFeatureFlagStore = create<FeatureFlagStoreState>((set, get) => ({
  flags: { ...DEFAULT_FEATURE_FLAGS },
  lastUpdated: null,
  isLoading: false,

  setFlags: (newFlags: Partial<FeatureFlagsState>) => {
    set((state) => ({
      flags: {
        ...state.flags,
        ...newFlags,
      },
      lastUpdated: Date.now(),
    }));
  },

  fetchRemoteFlags: async (force: boolean = false) => {
    const { lastUpdated, isLoading } = get();

    // 1. Rate-limiting internal: Hindari kueri berlebih jika cache masih segar (< 5 menit)
    if (!force && lastUpdated && Date.now() - lastUpdated < CACHE_TTL_MS) {
      return;
    }

    if (isLoading) return;

    set({ isLoading: true });

    try {
      // 2. Kueri remote endpoint dengan fallback fail-safe
      const response = await api.get('/config/feature-flags', { timeout: 5000 });
      const rawData = response.data?.data || response.data?.flags || response.data;

      // 3. Validasi skema Zod
      const parsed = featureFlagsPayloadSchema.safeParse(rawData);

      if (parsed.success) {
        const validatedFlags: Partial<FeatureFlagsState> = {};
        const allowedKeys: FeatureKey[] = [
          'p2p_transfer',
          'topup_midtrans',
          'bank_withdrawal',
          'kyc_submission',
          'biometric_login',
        ];

        for (const key of allowedKeys) {
          if (parsed.data[key]) {
            validatedFlags[key] = parsed.data[key];
          }
        }

        set((state) => ({
          flags: {
            ...state.flags,
            ...validatedFlags,
          },
          lastUpdated: Date.now(),
          isLoading: false,
        }));
      } else {
        console.warn(
          '[FEATURE_FLAGS] Validasi remote payload gagal, mempertahankan flag saat ini:',
          parsed.error
        );
        set({ lastUpdated: Date.now(), isLoading: false });
      }
    } catch (error) {
      // Fail-Safe: Jika jaringan offline atau endpoint belum aktif, tetap gunakan konfigurasi lokal
      console.warn(
        '[FEATURE_FLAGS] Gagal sinkronisasi remote flag (fallback fail-safe aktif):',
        (error as any)?.message || error
      );
      set({ isLoading: false });
    }
  },

  isFeatureEnabled: (key: FeatureKey): boolean => {
    return get().flags[key]?.enabled ?? true;
  },

  getMaintenanceNotice: (key: FeatureKey): string | null => {
    const flag = get().flags[key];
    if (!flag || flag.enabled) return null;
    return (
      flag.maintenanceMessage ||
      'Layanan Ini Sedang Dalam Pemeliharaan Berkala. Untuk sementara waktu mutasi ini ditangguhkan demi keamanan dana Anda.'
    );
  },
}));

/**
 * Selector Helper Mandiri
 */
export const isFeatureEnabled = (key: FeatureKey): boolean => {
  return useFeatureFlagStore.getState().isFeatureEnabled(key);
};

export const getMaintenanceNotice = (key: FeatureKey): string | null => {
  return useFeatureFlagStore.getState().getMaintenanceNotice(key);
};
