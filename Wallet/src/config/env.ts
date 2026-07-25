// src/config/env.ts

// Kita mengambil nilai dari .env bawaan Expo
const API_URL = process.env.PUBLIC_API_URL;
const BASE_URL = process.env.EXPO_BASE_URL

export const ENV = {
  // Jika API_URL terbaca, gunakan itu. 
  // Jika undefined, GUNAKAN URL CADANGAN INI agar aplikasi tetap hidup!
  //http://192.168.1.101:3000/api/v1 || http://127.0.0.1:3000/api/v1
  //https://irritative-yuriko-knolly.ngrok-free.dev
  API_URL: API_URL || 'https://irritative-yuriko-knolly.ngrok-free.dev',
};

// [CLEAN CODE] Sistem Peringatan Dini di Terminal
if (!API_URL) {
  console.warn("⚠️ PERINGATAN: File .env tidak terbaca oleh Expo! Menggunakan URL cadangan bawaan dari src/config/env.ts");
  console.log(BASE_URL)
}