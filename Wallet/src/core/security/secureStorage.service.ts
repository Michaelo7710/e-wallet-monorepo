import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@core/network/api';

export interface ISecureStorage {
  setItem<T>(key: string, value: T): Promise<boolean>;
  getItem<T = string>(key: string, isJson?: boolean): Promise<T | null>;
  removeItem(key: string): Promise<boolean>;
  clearSession(): Promise<boolean>;
}

export class SecureStorageService implements ISecureStorage {
  /**
   * Menyimpan data ke hardware-backed SecureStore dengan validasi tipe defensif
   * dan konversi otomatis untuk mencegah crash native "Values must be strings".
   */
  async setItem<T>(key: string, value: T): Promise<boolean> {
    if (!key || typeof key !== 'string') {
      console.warn('[SECURE_STORAGE] setItem dibatalkan: key tidak valid.');
      return false;
    }

    // Jika nilai null atau undefined, alihkan ke removeItem untuk membersihkan data
    if (value === undefined || value === null) {
      return this.removeItem(key);
    }

    let stringValue: string;
    if (typeof value === 'string') {
      stringValue = value;
    } else {
      try {
        stringValue = JSON.stringify(value);
      } catch (serializeError) {
        console.warn(
          `[SECURE_STORAGE] Gagal serialisasi JSON untuk key "${key}":`,
          serializeError
        );
        return false;
      }
    }

    try {
      await SecureStore.setItemAsync(key, stringValue);
      return true;
    } catch (error) {
      console.warn(
        `[SECURE_STORAGE] Gagal menyimpan data untuk key "${key}":`,
        error
      );
      return false;
    }
  }

  /**
   * Mengambil data dari SecureStore secara aman tanpa melempar unhandled exception.
   */
  async getItem<T = string>(key: string, isJson: boolean = false): Promise<T | null> {
    if (!key || typeof key !== 'string') {
      return null;
    }

    try {
      const rawValue = await SecureStore.getItemAsync(key);
      if (rawValue === null || rawValue === undefined) {
        return null;
      }

      if (isJson) {
        try {
          return JSON.parse(rawValue) as T;
        } catch (parseError) {
          console.warn(
            `[SECURE_STORAGE] Gagal parsing JSON untuk key "${key}", fallback ke raw:`,
            parseError
          );
          return null;
        }
      }

      return rawValue as unknown as T;
    } catch (error) {
      console.warn(
        `[SECURE_STORAGE] Gagal mengambil data untuk key "${key}":`,
        error
      );
      return null;
    }
  }

  /**
   * Menghapus kunci dari SecureStore secara aman.
   */
  async removeItem(key: string): Promise<boolean> {
    if (!key || typeof key !== 'string') {
      return false;
    }

    try {
      await SecureStore.deleteItemAsync(key);
      return true;
    } catch (error) {
      console.warn(
        `[SECURE_STORAGE] Gagal menghapus data untuk key "${key}":`,
        error
      );
      return false;
    }
  }

  /**
   * Membersihkan seluruh data sesi autentikasi secara paralel dan aman.
   */
  async clearSession(): Promise<boolean> {
    const sessionKeys = [
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ];

    try {
      const results = await Promise.allSettled(
        sessionKeys.map((key) => this.removeItem(key))
      );

      const allSuccess = results.every(
        (res) => res.status === 'fulfilled' && res.value === true
      );
      return allSuccess;
    } catch (error) {
      console.warn('[SECURE_STORAGE] Gagal membersihkan sesi:', error);
      return false;
    }
  }
}

export const secureStorageService = new SecureStorageService();
export default secureStorageService;
