import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '@domain/entities/user';
import { STORAGE_KEYS } from '@core/network/api';
import { biometricsService } from '@core/security/biometrics.service';

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
      await SecureStore.setItemAsync(
        STORAGE_KEYS.BIOMETRICS_ENABLED,
        enabled ? 'true' : 'false'
      );
    } catch (error) {
      console.error('Error storing biometric preference:', error);
    } finally {
      set({ isBiometricsEnabled: enabled });
    }
  },

  loginSession: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    set({
      user,
      token: accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logoutSession: async () => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error clearing secure tokens:', error);
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
      const isAvailable = await biometricsService.isAvailable();
      if (!isAvailable) {
        return false;
      }

      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      const userDataStr = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);

      if (!accessToken || !refreshToken) {
        return false;
      }

      const authSuccess = await biometricsService.authenticate(
        'Pindai sidik jari atau wajah Anda untuk masuk'
      );

      if (authSuccess) {
        let user: User | null = null;
        if (userDataStr) {
          try {
            user = JSON.parse(userDataStr);
          } catch {
            user = null;
          }
        }

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
      console.error('Fast login with biometrics failed:', error);
      return false;
    }
  },

  hydrate: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      const userDataStr = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      const biometricPref = await SecureStore.getItemAsync(STORAGE_KEYS.BIOMETRICS_ENABLED);

      const isBiometricsEnabled = biometricPref !== 'false';
      let user: User | null = null;
      if (userDataStr) {
        try {
          user = JSON.parse(userDataStr);
        } catch {
          user = null;
        }
      }

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
      console.error('Auth Hydration Error:', error);
      set({ isLoading: false });
    }
  },
}));