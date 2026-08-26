// import { create } from 'zustand';
// import * as SecureStore from 'expo-secure-store';
// import { User } from '@domain/entities/user';
// import { STORAGE_KEYS } from '@core/network/api';

// interface AuthState {
//   user: User | null;
//   token: string | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;

//   setAccessToken: (token: string) => void;
//   setUser: (user: User) => void;
//   login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
//   logout: () => Promise<void>;
//   hydrate: () => Promise<void>;
// }

// export const useAuthStore = create<AuthState>((set) => ({
//   user: null,
//   token: null,
//   isAuthenticated: false,
//   isLoading: true,

//   setAccessToken: (token: string) => set({ token }),
//   setUser: (user: User) => set({ user }),

//   login: async (user, accessToken, refreshToken) => {
//     await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
//     await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

//     set({
//       user,
//       token: accessToken,
//       isAuthenticated: true,
//       isLoading: false,
//     });
//   },

//   logout: async () => {
//     try {
//       await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
//       await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
//     } catch (error) {
//       console.error('Error clearing tokens:', error);
//     } finally {
//       set({
//         user: null,
//         token: null,
//         isAuthenticated: false,
//         isLoading: false,
//       });
//     }
//   },

//   hydrate: async () => {
//     try {
//       const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
//       const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

//       if (accessToken && refreshToken) {
//         set({ token: accessToken, isAuthenticated: true, isLoading: false });
//       } else {
//         set({ isLoading: false });
//       }
//     } catch (error) {
//       console.error('Error hydrating auth state:', error);
//       set({ isLoading: false });
//     }
//   },
// }));

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '@domain/entities/user';
import { STORAGE_KEYS } from '@core/network/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  loginSession: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logoutSession: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAccessToken: (token: string) => set({ token }),
  setUser: (user: User) => set({ user }),

  loginSession: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
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

  hydrate: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);

      if (accessToken && refreshToken) {
        set({ token: accessToken, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Auth Hydration Error:', error);
      set({ isLoading: false });
    }
  },
}));