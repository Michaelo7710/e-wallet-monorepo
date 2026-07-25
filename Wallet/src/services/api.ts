import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
// Nanti kita akan mengimpor Zustand store di sini untuk memicu aksi logout
import { useAuthStore } from '@store/useAuthStore'; 
import { ENV } from '../config/env';

// const API_URL = process.env.PUBLIC_API_URL;

// if (!API_URL) {
//   console.error("🔥 FATAL ERROR: Variabel EXPO_PUBLIC_API_URL tidak ditemukan! Pastikan file .env ada di root folder.");
// }

// 1. Inisialisasi Mesin Utama
const api = axios.create({
  // UBAH INI: Gunakan IP lokal komputermu (IPv4) beserta port peladen backend-mu
  //http://192.168.1.101:3000/api/v1 || http://127.0.0.1:3000/api/v1
  baseURL: ENV.API_URL, 
  timeout: 10000, // Batas waktu tunggu 10 detik agar aplikasi tidak hanging
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// 2. Interceptor REQUEST (Pintu Keluar)
// Setiap kali aplikasi mau memanggil API, fungsi ini otomatis menyisipkan KTP Digital (Token)
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Gagal mengambil token dari brankas HP', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Interceptor RESPONSE (Pintu Masuk)
// Setiap kali backend membalas, fungsi ini mencegat dan memeriksa statusnya
api.interceptors.response.use(
  (response) => {
    // Jika sukses (200, 201), biarkan lewat
    return response;
  },
  async (error) => {
    // Jika backend menolak karena Token kedaluwarsa atau tidak valid (401)
    if (error.response && error.response.status === 401) {
      console.warn('Sesi kedaluwarsa, melakukan auto-logout...');
      
      // Hapus token yang sudah hangus dari brankas HP
      await SecureStore.deleteItemAsync('userToken');
      
      // TODO: Panggil fungsi logout dari Zustand untuk membersihkan memori aplikasi
      await useAuthStore.getState().logout(); 
    }
    
    // Meneruskan pesan error aslinya (dari backend) ke komponen UI yang memanggilnya
    return Promise.reject(error);
  }
);


export default api;