import { useEffect } from 'react';
import * as ScreenCapture from 'expo-screen-capture';

export const useScreenGuard = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;
    const activateGuard = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync('greenpay_secure_vault');
      } catch (err) {
        console.warn('[SCREEN GUARD] Gagal mengaktifkan proteksi layar:', err);
      }
    };
    activateGuard();
    return () => {
      ScreenCapture.allowScreenCaptureAsync('greenpay_secure_vault').catch(() => {});
    };
  }, [enabled]);
};
