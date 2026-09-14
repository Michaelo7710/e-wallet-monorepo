import * as LocalAuthentication from 'expo-local-authentication';

export const BiometricsService = {
  /**
   * Memeriksa apakah hardware biometrik tersedia dan pengguna telah mendaftarkan biometrik di sistem OS.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.warn('[BIOMETRICS] Gagal memeriksa ketersediaan biometrik:', error);
      return false;
    }
  },

  /**
   * Mendeteksi jenis biometrik ('Face ID', 'Fingerprint', atau 'Biometrik').
   */
  async getBiometricType(): Promise<string> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'Face ID';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'Fingerprint';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return 'Iris';
      }
      return 'Biometrik';
    } catch (error) {
      console.warn('[BIOMETRICS] Gagal mendeteksi tipe biometrik:', error);
      return 'Biometrik';
    }
  },

  /**
   * Melakukan autentikasi biometrik dengan prompt modal OS.
   */
  async authenticate(promptMessage?: string): Promise<boolean> {
    try {
      const isReady = await this.isAvailable();
      if (!isReady) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Pindai sidik jari atau wajah Anda untuk masuk',
        fallbackLabel: 'Gunakan Kata Sandi',
        disableDeviceFallback: false,
        cancelLabel: 'Batal',
      });

      return result.success;
    } catch (error) {
      console.warn('[BIOMETRICS] Autentikasi biometrik gagal:', error);
      return false;
    }
  },
};

export const biometricsService = BiometricsService;
export default BiometricsService;
