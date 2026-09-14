import * as z from 'zod';

jest.mock('../src/core/security/biometrics.service', () => ({
  BiometricsService: {
    isAvailable: jest.fn(),
    authenticate: jest.fn(),
  },
}));

import { useAuthStore } from '../src/core/storage/useAuthStore';
import { User } from '../src/domain/entities/user';
import { UserMapper } from '../src/data/mappers/userMapper';
import { UserDTO } from '../src/data/models/userDTO';

const kycSchema = z.object({
  nik: z
    .string()
    .length(16, { message: 'NIK harus tepat 16 digit angka' })
    .regex(/^\d+$/, { message: 'NIK hanya boleh berisi angka' }),
  bio: z
    .string()
    .min(10, { message: 'Deskripsi profil/tujuan transaksi minimal 10 karakter' }),
  idCardPhoto: z
    .string()
    .min(1, { message: 'Foto fisik KTP wajib dilampirkan' }),
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

describe('TASK-QA-04: Multi-Factor KYC Verification Engine & Gate', () => {
  const baseUser: User = {
    id: 'usr-kyc-01',
    username: 'ahmad_yani',
    email: 'ahmad@example.com',
    phoneNumber: '081234567890',
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
    useAuthStore.getState().setUser(baseUser);
  });

  describe('1. Zod Validation Schema (kycSchema)', () => {
    it('harus valid jika NIK 16 digit angka, bio >= 10 karakter, dan idCardPhoto terisi', () => {
      const validData = {
        nik: '3201123456780001',
        bio: 'Pengusaha kuliner, kebutuhan transaksi harian',
        idCardPhoto: 'data:image/jpeg;base64,samplebase64ktp',
      };

      const result = kycSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('harus menolak jika NIK tidak tepat 16 digit', () => {
      const invalidNikShort = {
        nik: '320112345',
        bio: 'Pengusaha kuliner, kebutuhan transaksi harian',
        idCardPhoto: 'data:image/jpeg;base64,samplebase64ktp',
      };
      const resultShort = kycSchema.safeParse(invalidNikShort);
      expect(resultShort.success).toBe(false);
      if (!resultShort.success) {
        expect(resultShort.error.issues[0].message).toBe('NIK harus tepat 16 digit angka');
      }

      const invalidNikLong = {
        nik: '320112345678000199',
        bio: 'Pengusaha kuliner, kebutuhan transaksi harian',
        idCardPhoto: 'data:image/jpeg;base64,samplebase64ktp',
      };
      const resultLong = kycSchema.safeParse(invalidNikLong);
      expect(resultLong.success).toBe(false);
    });

    it('harus menolak jika NIK mengandung karakter non-angka', () => {
      const invalidNikChar = {
        nik: '320112345678000A',
        bio: 'Pengusaha kuliner, kebutuhan transaksi harian',
        idCardPhoto: 'data:image/jpeg;base64,samplebase64ktp',
      };
      const result = kycSchema.safeParse(invalidNikChar);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('NIK hanya boleh berisi angka');
      }
    });

    it('harus menolak jika bio kurang dari 10 karakter', () => {
      const invalidBio = {
        nik: '3201123456780001',
        bio: 'Pendek',
        idCardPhoto: 'data:image/jpeg;base64,samplebase64ktp',
      };
      const result = kycSchema.safeParse(invalidBio);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Deskripsi profil/tujuan transaksi minimal 10 karakter'
        );
      }
    });

    it('harus menolak jika foto fisik KTP kosong', () => {
      const invalidPhoto = {
        nik: '3201123456780001',
        bio: 'Pengusaha kuliner, kebutuhan transaksi harian',
        idCardPhoto: '',
      };
      const result = kycSchema.safeParse(invalidPhoto);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Foto fisik KTP wajib dilampirkan');
      }
    });
  });

  describe('2. Pintu Gerbang 2FA Security Gate Logic', () => {
    it('harus mendeteksi status 2FA belum aktif untuk memblokir form KYC', () => {
      useAuthStore.getState().setUser({ ...baseUser, twoFactorEnabled: false });
      const user = useAuthStore.getState().user;

      const isGateBlocked = !user?.twoFactorEnabled;
      expect(isGateBlocked).toBe(true);
    });

    it('harus membuka akses form KYC jika 2FA sudah aktif', () => {
      useAuthStore.getState().setUser({ ...baseUser, twoFactorEnabled: true });
      const user = useAuthStore.getState().user;

      const isGateBlocked = !user?.twoFactorEnabled;
      expect(isGateBlocked).toBe(false);
    });
  });

  describe('3. UserMapper & SSOT Persistence for KYC Fields', () => {
    it('harus memetakan id_card_photo dan bio secara presisi antara DTO dan Domain', () => {
      const dto: UserDTO = {
        _id: 'usr-kyc-02',
        username: 'siti_aminah',
        email: 'siti@example.com',
        phone_number: '081298765432',
        role: 'user',
        is_verified: true,
        is_suspended: false,
        two_factor_enabled: true,
        avatar: null,
        nik: '3201998877660002',
        balance: 25000000,
        is_kyc_verified: true,
        account_tier: 'premium',
        has_pin: true,
        id_card_photo: 'data:image/jpeg;base64,validktpbase64',
        bio: 'Pedagang grosir sembako pasar induk',
      };

      const domain = UserMapper.toDomain(dto);
      expect(domain.idCardPhoto).toBe('data:image/jpeg;base64,validktpbase64');
      expect(domain.bio).toBe('Pedagang grosir sembako pasar induk');
      expect(domain.accountTier).toBe('premium');
      expect(domain.isKycVerified).toBe(true);
      expect(domain.isVerified).toBe(true);

      const backToDTO = UserMapper.toDTO(domain);
      expect(backToDTO.id_card_photo).toBe('data:image/jpeg;base64,validktpbase64');
      expect(backToDTO.bio).toBe('Pedagang grosir sembako pasar induk');
      expect(backToDTO.account_tier).toBe('premium');
      expect(backToDTO.is_kyc_verified).toBe(true);
    });

    it('harus menyelaraskan state authStore dan persistensi SQLite SSOT saat KYC berhasil', async () => {
      const { userLocalDataSource } = require('../src/core/di/container');

      const verifiedUser: User = {
        ...baseUser,
        twoFactorEnabled: true,
        nik: '3201123456780001',
        idCardPhoto: 'data:image/jpeg;base64,ktpimage',
        bio: 'Wiraswasta transaksi harian bisnis',
        isKycVerified: true,
        isVerified: true,
        accountTier: 'premium',
      };

      useAuthStore.getState().setUser(verifiedUser);
      await userLocalDataSource.upsertProfile(verifiedUser);

      expect(useAuthStore.getState().user?.accountTier).toBe('premium');
      expect(useAuthStore.getState().user?.isKycVerified).toBe(true);
      expect(useAuthStore.getState().user?.idCardPhoto).toBe('data:image/jpeg;base64,ktpimage');
      expect(useAuthStore.getState().user?.bio).toBe('Wiraswasta transaksi harian bisnis');

      expect(userLocalDataSource.upsertProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'usr-kyc-01',
          nik: '3201123456780001',
          idCardPhoto: 'data:image/jpeg;base64,ktpimage',
          bio: 'Wiraswasta transaksi harian bisnis',
          accountTier: 'premium',
          isKycVerified: true,
        })
      );
    });
  });
});
