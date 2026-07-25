import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '@type/index';

// 1. Mendefinisikan isi dari Brankas Global
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Digunakan oleh Splash Screen saat mengecek memori HP
  
  // Aksi (Actions)
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>; // Memuat ulang sesi saat aplikasi baru dibuka
}

// 2. Membuat Brankas (Store)
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Default true karena kita harus mengecek SecureStore dulu

  login: async (user, token) => {
    // Simpan token ke brankas fisik HP
    await SecureStore.setItemAsync('userToken', token);
    // Simpan data ke memori RAM aplikasi (Zustand)
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    // Hapus token dari brankas fisik HP
    await SecureStore.deleteItemAsync('userToken');
    // Kosongkan memori RAM aplikasi
    set({ user: null, token: null, isAuthenticated: false });
  },

  hydrate: async () => {
    try {
      // Saat aplikasi baru dibuka, cek apakah ada token yang tersimpan
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        // Catatan: Di aplikasi nyata skala produksi, kita idealnya memanggil API 
        // /auth/me di sini untuk mengambil profil user terbaru menggunakan token ini.
        // Untuk MVP, kita set status login menjadi true terlebih dahulu.
        set({ token, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Gagal memuat sesi:', error);
      set({ isLoading: false });
    }
  }
}));