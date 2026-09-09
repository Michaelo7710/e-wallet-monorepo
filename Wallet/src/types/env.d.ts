declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_ENV_MODE?: 'local' | 'ngrok' | 'vercel';
      EXPO_PUBLIC_API_URL?: string;
    }
  }
}

export {};
