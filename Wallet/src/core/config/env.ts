import { z } from 'zod';

export const envModeSchema = z.enum(['local', 'ngrok', 'vercel']);
export type EnvMode = z.infer<typeof envModeSchema>;

// 1. Baca Presets Murni dari Environment Variables
export const ENV_PRESETS: Record<EnvMode, string> = {
  local: process.env.EXPO_PUBLIC_API_URL_LOCAL || 'http://localhost:3000/api/v1',
  ngrok: process.env.EXPO_PUBLIC_API_URL_NGROK || '',
  vercel: process.env.EXPO_PUBLIC_API_URL_VERCEL || '',
};

// 2. Parsing Mode Target dengan Zod
const rawEnvMode = process.env.EXPO_PUBLIC_ENV_MODE;
const modeValidation = envModeSchema.safeParse(rawEnvMode);
export const ACTIVE_MODE: EnvMode = modeValidation.success ? modeValidation.data : 'local';

// 3. Resolusi Base API URL
const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;
let resolvedApiUrl: string;

if (rawApiUrl && rawApiUrl.trim() !== '') {
  const urlValidation = z.string().url().safeParse(rawApiUrl.trim());
  resolvedApiUrl = urlValidation.success ? urlValidation.data : ENV_PRESETS[ACTIVE_MODE];
} else {
  resolvedApiUrl = ENV_PRESETS[ACTIVE_MODE];
}

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

console.log('==================================================');
console.log('🚀 GREENPAY MOBILE ENVIRONMENT ENGINE ACTIVE');
console.log(`📍 Mode Target : [ ${ENV.MODE.toUpperCase()} ]`);
console.log(`🌐 Base API URL: ${ENV.API_URL}`);
console.log(`🔒 Production  : ${ENV.IS_PROD ? 'YES' : 'NO'}`);
console.log(`🛠️  Development : ${ENV.IS_DEV ? 'YES' : 'NO'}`);
console.log('==================================================');
