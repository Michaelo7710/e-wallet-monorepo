// // src/config/env.ts

// // Kita mengambil nilai dari .env bawaan Expo
// const API_URL = process.env.PUBLIC_API_URL;
// const BASE_URL = process.env.EXPO_BASE_URL

// export const ENV = {
//   // Jika API_URL terbaca, gunakan itu. 
//   // Jika undefined, GUNAKAN URL CADANGAN INI agar aplikasi tetap hidup!
//   //http://192.168.1.101:3000/api/v1 || http://127.0.0.1:3000/api/v1
//   //https://irritative-yuriko-knolly.ngrok-free.dev
//   API_URL: API_URL || 'https://irritative-yuriko-knolly.ngrok-free.dev',
// };

// // [CLEAN CODE] Sistem Peringatan Dini di Terminal
// if (!API_URL) {
//   console.warn("⚠️ PERINGATAN: File .env tidak terbaca oleh Expo! Menggunakan URL cadangan bawaan dari src/config/env.ts");
//   console.log(BASE_URL)
// }

// const API_URL = process.env.EXPO_PUBLIC_API_URL;

// export const ENV = {
//   API_URL: API_URL || 'http://127.0.0.1:3000/api/v1',
// };

// if (!API_URL) {
//   console.warn(
//     'PERINGATAN: File .env (EXPO_PUBLIC_API_URL) tidak terbaca! Menggunakan fallback localhost.'
//   );
// }

// 1. Kamus Presets Target Server GreenPay
const ENV_PRESETS = {
  // Mode Development Lokal (Ubah IP '192.168.1.X' sesuai IPv4 Wi-Fi laptopmu)
  local: 'http://192.168.43.20:3000/api/v1',

  // Mode Tunneling Ngrok (Aktif jika laptop & HP beda jaringan / remote)
  ngrok: 'https://irritative-yuriko-knolly.ngrok-free.dev/api/v1',

  // Mode Production / Showcase Portofolio Vercel
  vercel: 'https://e-wallet-monorepo-ohi0qz3xs-dev-mich.vercel.app/api/v1',
} as const;

type EnvMode = keyof typeof ENV_PRESETS;

// 2. Membaca Konfigurasi dari Environment Variable
const ENV_MODE_FROM_ENV = process.env.EXPO_PUBLIC_ENV_MODE as EnvMode | undefined;
const CUSTOM_API_URL = process.env.EXPO_PUBLIC_API_URL;

// 3. Sakelar Manual (Fallback jika .env tidak dibaca Expo)
// Ubah variabel ini menjadi 'local' | 'ngrok' | 'vercel' untuk mengganti mode secara manual
const MANUAL_DEFAULT_MODE: EnvMode = 'local';

// 4. Penentuan Target URL Akhir
const ACTIVE_MODE: EnvMode = ENV_MODE_FROM_ENV || MANUAL_DEFAULT_MODE;

export const ENV = {
  MODE: ACTIVE_MODE,
  API_URL: CUSTOM_API_URL || ENV_PRESETS[ACTIVE_MODE] || ENV_PRESETS.local,
  IS_DEV: ACTIVE_MODE !== 'vercel',
};

// 5. Diagnostic Logger Terminal Expo (Monitoring Server Target)
console.log('==================================================');
console.log(`🚀 GREENPAY MOBILE ENVIRONMENT ENGINE ACTIVE`);
console.log(`📍 Mode Target : [ ${ENV.MODE.toUpperCase()} ]`);
console.log(`🌐 Base API URL: ${ENV.API_URL}`);
console.log('==================================================');

