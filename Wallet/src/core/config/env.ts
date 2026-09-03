import { z } from 'zod';

// 1. Kamus Presets Target Server GreenPay
export const ENV_PRESETS = {
  // Mode Development Lokal (Ubah IP '192.168.1.X' sesuai IPv4 Wi-Fi laptopmu)
  local: 'http://192.168.43.20:3000/api/v1',

  // Mode Tunneling Ngrok (Aktif jika laptop & HP beda jaringan / remote)
  ngrok: 'https://irritative-yuriko-knolly.ngrok-free.dev/api/v1',

  // Mode Production / Showcase Portofolio Vercel
  vercel: 'https://e-wallet-monorepo-ohi0qz3xs-dev-mich.vercel.app/api/v1',
} as const;

// 2. Definisi Zod Schema untuk Lingkungan Expo
export const envModeSchema = z.enum(['local', 'ngrok', 'vercel']);
export type EnvMode = z.infer<typeof envModeSchema>;

// 3. Validasi Runtime Schema-First
// A. Validasi Mode Lingkungan
const rawEnvMode: string | undefined = process.env.EXPO_PUBLIC_ENV_MODE;
const modeValidation = envModeSchema.safeParse(rawEnvMode);

let ACTIVE_MODE: EnvMode;

if (modeValidation.success) {
  ACTIVE_MODE = modeValidation.data;
} else {
  if (rawEnvMode) {
    console.warn(
      `⚠️ [ENV_VALIDATION] Nilai EXPO_PUBLIC_ENV_MODE tidak valid ("${rawEnvMode}"). Fallback ke mode default 'local'. Pilihan valid: ${envModeSchema.options.join(', ')}`
    );
  } else {
    console.warn(
      "⚠️ [ENV_VALIDATION] EXPO_PUBLIC_ENV_MODE tidak didefinisikan. Menetapkan mode default 'local'."
    );
  }
  ACTIVE_MODE = 'local';
}

// B. Validasi Custom API URL (jika diset)
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;
let resolvedApiUrl: string;

if (rawApiUrl && rawApiUrl.trim() !== '') {
  const urlValidation = z.string().url().safeParse(rawApiUrl.trim());
  if (urlValidation.success) {
    resolvedApiUrl = urlValidation.data;
  } else {
    console.warn(
      `⚠️ [ENV_VALIDATION] EXPO_PUBLIC_API_URL ("${rawApiUrl}") bukan URL HTTP/HTTPS yang valid. Fallback ke preset [${ACTIVE_MODE}]: ${ENV_PRESETS[ACTIVE_MODE]}`
    );
    resolvedApiUrl = ENV_PRESETS[ACTIVE_MODE];
  }
} else {
  resolvedApiUrl = ENV_PRESETS[ACTIVE_MODE];
}

// 4. Struktur Objek ENV Teruji & Dibekukan (Object.freeze)
export interface AppEnvironment {
  readonly MODE: EnvMode;
  readonly API_URL: string;
  readonly IS_DEV: boolean;
  readonly IS_PROD: boolean;
}

export const ENV: AppEnvironment = Object.freeze({
  MODE: ACTIVE_MODE,
  API_URL: resolvedApiUrl,
  IS_DEV: ACTIVE_MODE !== 'vercel',
  IS_PROD: ACTIVE_MODE === 'vercel',
});

// 5. Diagnostic Logger Terminal Expo (Monitoring Server Target)
console.log('==================================================');
console.log('🚀 GREENPAY MOBILE ENVIRONMENT ENGINE ACTIVE');
console.log(`📍 Mode Target : [ ${ENV.MODE.toUpperCase()} ]`);
console.log(`🌐 Base API URL: ${ENV.API_URL}`);
console.log(`🔒 Production  : ${ENV.IS_PROD ? 'YES' : 'NO'}`);
console.log(`🛠️  Development : ${ENV.IS_DEV ? 'YES' : 'NO'}`);
console.log('==================================================');
