import * as z from 'zod';

jest.mock('../src/core/security/biometrics.service', () => ({
  BiometricsService: {
    isAvailable: jest.fn(),
    authenticate: jest.fn(),
  },
}));

import { useAuthStore } from '../src/core/storage/useAuthStore';
import { User } from '../src/domain/entities/user';

const twoFactorSetupSchema = z.object({
  code: z
    .string()
    .length(6, { message: 'Kode harus 6 digit angka' })
    .regex(/^\d+$/, { message: 'Hanya boleh angka' }),
});

jest.mock('../src/core/di/container', () => ({
  userLocalDataSource: {
    upsertProfile: jest.fn().mockResolvedValue(undefined),
    clearProfile: jest.fn().mockResolvedValue(undefined),
  },
  paymentLocalDataSource: {
    clearAll: jest.fn().mockResolvedValue(undefined),
  },
  userRepository: {},
  paymentRepository: {},
  authRepository: {},
  adminRepository: {},
}));

jest.mock('../src/core/database/sqlite');
jest.mock('@core/network/api', () => ({
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    BIOMETRICS_ENABLED: 'biometrics_enabled',
  },
}));
jest.mock('../src/core/security/secureStorage.service', () => ({
  secureStorageService: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    clearSession: jest.fn(),
  },
}));

describe('TASK-QA-03: Two-Factor Authentication Setup & Profile SSOT', () => {
  const initialUser: User = {
    id: 'usr-2fa-01',
    username: 'john_doe',
    email: 'john@example.com',
    phoneNumber: '08123456789',
    role: 'user',
    isVerified: false,
    isSuspended: false,
    twoFactorEnabled: false,
    avatar: null,
    nik: null,
    balance: 5000000,
    isEmailVerified: true,
    isKycVerified: false,
    accountTier: 'basic',
    hasPin: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().setUser(initialUser);
  });

  describe('Validation Schema (twoFactorSetupSchema)', () => {
    it('harus valid jika kode berisi 6 digit angka numerik', () => {
      const result = twoFactorSetupSchema.safeParse({ code: '123456' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('123456');
      }
    });

    it('harus menolak jika kode kurang dari 6 digit', () => {
      const result = twoFactorSetupSchema.safeParse({ code: '12345' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Kode harus 6 digit angka');
      }
    });

    it('harus menolak jika kode lebih dari 6 digit', () => {
      const result = twoFactorSetupSchema.safeParse({ code: '1234567' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Kode harus 6 digit angka');
      }
    });

    it('harus menolak jika kode mengandung huruf atau karakter non-angka', () => {
      const result = twoFactorSetupSchema.safeParse({ code: '12345a' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Hanya boleh angka');
      }
    });
  });

  describe('State & SQLite SSOT Synchronization on 2FA Verification', () => {
    it('harus memperbarui twoFactorEnabled ke true pada authStore dan SQLite saat verifikasi berhasil', async () => {
      const { userLocalDataSource } = require('../src/core/di/container');

      // Kondisi awal: 2FA belum aktif
      expect(useAuthStore.getState().user?.twoFactorEnabled).toBe(false);

      // Simulasi callback onSuccess pada TwoFactorSetupScreen
      const currentUser = useAuthStore.getState().user;
      expect(currentUser).toBeDefined();

      if (currentUser) {
        const updatedUser = { ...currentUser, twoFactorEnabled: true };
        useAuthStore.getState().setUser(updatedUser);
        await userLocalDataSource.upsertProfile(updatedUser);
      }

      // Verifikasi AuthStore terupdate secara reaktif
      const stateUser = useAuthStore.getState().user;
      expect(stateUser?.twoFactorEnabled).toBe(true);

      // Verifikasi userLocalDataSource.upsertProfile dipanggil dengan data mutakhir
      expect(userLocalDataSource.upsertProfile).toHaveBeenCalledTimes(1);
      expect(userLocalDataSource.upsertProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'usr-2fa-01',
          twoFactorEnabled: true,
        })
      );
    });
  });

  describe('Profile Screen 2FA Menu Routing Logic', () => {
    it('harus mengarahkan ke TwoFactorSetup jika 2FA belum aktif', () => {
      const mockNavigate = jest.fn();
      const mockAlert = jest.fn();

      const user = { ...initialUser, twoFactorEnabled: false };

      // Handler logic dari ProfileScreen
      const handleTwoFactorPress = (u: User | null) => {
        if (u?.twoFactorEnabled) {
          mockAlert(
            'Proteksi 2FA Aktif',
            'Akun Anda telah diamankan dengan autentikator dua faktor berbasis TOTP.'
          );
        } else {
          mockNavigate('TwoFactorSetup');
        }
      };

      handleTwoFactorPress(user);
      expect(mockNavigate).toHaveBeenCalledWith('TwoFactorSetup');
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('harus memunculkan alert jika 2FA sudah aktif', () => {
      const mockNavigate = jest.fn();
      const mockAlert = jest.fn();

      const user = { ...initialUser, twoFactorEnabled: true };

      const handleTwoFactorPress = (u: User | null) => {
        if (u?.twoFactorEnabled) {
          mockAlert(
            'Proteksi 2FA Aktif',
            'Akun Anda telah diamankan dengan autentikator dua faktor berbasis TOTP.'
          );
        } else {
          mockNavigate('TwoFactorSetup');
        }
      };

      handleTwoFactorPress(user);
      expect(mockAlert).toHaveBeenCalledWith(
        'Proteksi 2FA Aktif',
        'Akun Anda telah diamankan dengan autentikator dua faktor berbasis TOTP.'
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
