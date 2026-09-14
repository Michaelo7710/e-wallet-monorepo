import { z } from 'zod';

// 1. Validasi Mode Target
export const envModeSchema = z.enum(['local', 'ngrok', 'vercel']);
export type EnvMode = z.infer<typeof envModeSchema>;

const rawEnvMode = process.env.EXPO_PUBLIC_ENV_MODE;
const parsedMode = envModeSchema.safeParse(rawEnvMode);
export const ACTIVE_MODE: EnvMode = parsedMode.success ? parsedMode.data : 'ngrok';

// 2. Baca Langsung URL dari EXPO_PUBLIC_API_URL (Akses Statis Murni untuk Babel AST Inliner)
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;
const urlSchema = z.string().url();
const parsedUrl = urlSchema.safeParse(rawApiUrl?.trim());

// 3. Fallback Cerdas jika .env tidak sengaja terhapus
let finalApiUrl: string;

if (parsedUrl.success) {
  finalApiUrl = parsedUrl.data;
} else {
  console.warn('⚠️ [ENV WARNING] EXPO_PUBLIC_API_URL tidak ditemukan di .env. Menggunakan fallback darurat.');
  if (ACTIVE_MODE === 'ngrok') {
    finalApiUrl = 'https://irritative-yuriko-knolly.ngrok-free.dev/api/v1';
  } else if (ACTIVE_MODE === 'vercel') {
    finalApiUrl = 'https://e-wallet-monorepo-ohi0qz3xs-dev-mich.vercel.app/api/v1';
  } else {
    // Default IP laptop aktif Anda
    finalApiUrl = 'http://192.168.43.20:3000/api/v1';
  }
}

export interface AppEnvironment {
  readonly MODE: EnvMode;
  readonly API_URL: string;
  readonly IS_DEV: boolean;
  readonly IS_PROD: boolean;
}

export const ENV: AppEnvironment = Object.freeze({
  MODE: ACTIVE_MODE,
  API_URL: finalApiUrl,
  IS_DEV: ACTIVE_MODE !== 'vercel',
  IS_PROD: ACTIVE_MODE === 'vercel',
});

console.log('==================================================');
console.log('🚀 GREENPAY MOBILE ENVIRONMENT ENGINE ACTIVE');
console.log(`📡 Mode Target : [ ${ENV.MODE.toUpperCase()} ]`);
console.log(`🔗 Base API URL: ${ENV.API_URL}`);
console.log(`🔒 Production  : ${ENV.IS_PROD ? 'YES' : 'NO'}`);
console.log(`🛠  Development : ${ENV.IS_DEV ? 'YES' : 'NO'}`);
console.log('==================================================');
