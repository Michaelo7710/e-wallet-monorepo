import { create } from 'zustand';
import { User } from '@domain/entities/user';

interface TempAuthState {
  preAuthToken: string | null;
  tempUser: User | null;
  expiresAt: number | null;
  setPreAuthSession: (token: string, user: User, ttlMs?: number) => void;
  clearPreAuthSession: () => void;
  isSessionValid: () => boolean;
}

export const useTempAuthStore = create<TempAuthState>((set, get) => ({
  preAuthToken: null,
  tempUser: null,
  expiresAt: null,
  setPreAuthSession: (token, user, ttlMs = 180000) => { // 3 menit TTL
    set({
      preAuthToken: token,
      tempUser: user,
      expiresAt: Date.now() + ttlMs,
    });
  },
  clearPreAuthSession: () => {
    set({ preAuthToken: null, tempUser: null, expiresAt: null });
  },
  isSessionValid: () => {
    const { preAuthToken, expiresAt } = get();
    if (!preAuthToken || !expiresAt) return false;
    return Date.now() < expiresAt;
  },
}));
