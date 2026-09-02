import { create } from 'zustand';
import { User } from '@domain/entities/user';
import { STORAGE_KEYS } from '@core/network/api';
import { secureStorageService } from '@core/security/secureStorage.service';
import { BiometricsService } from '@core/security/biometrics.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBiometricsEnabled: boolean;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  setBiometricsEnabled: (enabled: boolean) => Promise<void>;
  loginSession: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logoutSession: () => Promise<void>;
  fastLoginWithBiometrics: () => Promise<boolean>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  isBiometricsEnabled: true,

  setAccessToken: (token: string) => set({ token }),
  setUser: (user: User) => set({ user }),

  setBiometricsEnabled: async (enabled: boolean) => {
    try {
      await secureStorageService.setItem(
        STORAGE_KEYS.BIOMETRICS_ENABLED,
        enabled ? 'true' : 'false'
      );
    } catch (error) {
      console.warn('[AUTH_STORE] Gagal menyimpan preferensi biometrik:', error);
    } finally {
      set({ isBiometricsEnabled: enabled });
    }
  },

  loginSession: async (user, accessToken, refreshToken) => {
    if (!user || !accessToken || !refreshToken) {
      console.warn('[AUTH_STORE] loginSession dibatalkan: parameter tidak lengkap.');
      return;
    }

    await secureStorageService.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await secureStorageService.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await secureStorageService.setItem(STORAGE_KEYS.USER_DATA, user);

    set({
      user,
      token: accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logoutSession: async () => {
    try {
      await secureStorageService.clearSession();
    } catch (error) {
      console.warn('[AUTH_STORE] Gagal membersihkan secure storage saat logout:', error);
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  fastLoginWithBiometrics: async () => {
    try {
      const isAvailable = await BiometricsService.isAvailable();
      if (!isAvailable) {
        return false;
      }

      const accessToken = await secureStorageService.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await secureStorageService.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
      const user = await secureStorageService.getItem<User>(STORAGE_KEYS.USER_DATA, true);

      if (!accessToken || !refreshToken) {
        return false;
      }

      const authSuccess = await BiometricsService.authenticate(
        'Pindai sidik jari atau wajah Anda untuk masuk'
      );

      if (authSuccess) {
        set({
          user,
          token: accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.warn('[AUTH_STORE] Fast login biometrik gagal:', error);
      return false;
    }
  },

  hydrate: async () => {
    try {
      const accessToken = await secureStorageService.getItem<string>(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await secureStorageService.getItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
      const user = await secureStorageService.getItem<User>(STORAGE_KEYS.USER_DATA, true);
      const biometricPref = await secureStorageService.getItem<string>(STORAGE_KEYS.BIOMETRICS_ENABLED);

      const isBiometricsEnabled = biometricPref !== 'false';

      if (accessToken && refreshToken) {
        set({
          token: accessToken,
          user,
          isAuthenticated: true,
          isLoading: false,
          isBiometricsEnabled,
        });
      } else {
        set({
          user,
          isLoading: false,
          isBiometricsEnabled,
        });
      }
    } catch (error) {
      console.warn('[AUTH_STORE] Gagal melakukan hidrasi sesi:', error);
      set({ isLoading: false });
    }
  },
}));