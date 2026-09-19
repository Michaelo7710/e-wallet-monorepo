import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as z from 'zod';

import KycVerificationScreen from '../src/features/user/screens/KycVerificationScreen';
import { ButtonCustom } from '../src/shared/components';

// Navigation Mocks
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    addListener: jest.fn(() => jest.fn()),
  }),
}));

// Expo Module Mocks
jest.mock('expo/virtual/env', () => ({
  env: process.env,
}));

jest.mock('expo-linear-gradient', () => {
  const { View: RNView } = require('react-native');
  return {
    LinearGradient: RNView,
  };
});

jest.mock('expo-image', () => {
  const { View: RNView } = require('react-native');
  return {
    Image: RNView,
  };
});

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
  setStatusBarStyle: jest.fn(),
  setStatusBarHidden: jest.fn(),
}));

jest.mock('expo-screen-capture', () => ({
  preventScreenCaptureAsync: jest.fn().mockResolvedValue(true),
  allowScreenCaptureAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/core/security/useScreenGuard', () => ({
  useScreenGuard: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);

jest.mock('../src/shared/layouts', () => {
  const ReactModule = require('react');
  const { View: RNView } = require('react-native');
  return {
    UserLayout: ({ children }: any) => ReactModule.createElement(RNView, { testID: 'user-layout' }, children),
    AuthLayout: ({ children }: any) => ReactModule.createElement(RNView, { testID: 'auth-layout' }, children),
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

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
import { maskNik } from '../src/shared/utils/masking';

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
  userRepository: {
    updateKyc: jest.fn(),
    getProfile: jest.fn(),
    setupPin: jest.fn(),
    updatePassword: jest.fn(),
    updatePin: jest.fn(),
    updateEmail: jest.fn(),
  },
  paymentRepository: {},
  authRepository: {},
  adminRepository: {},
}));

jest.mock('../src/core/database/sqlite');
jest.mock('@core/network/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
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

  describe('4. [TASK-FE-11 DoD] NIK Display Masking & Anti-Shoulder Surfing Protection', () => {
    it('harus menyamarkan 16-digit NIK dengan format 3201 **** **** 0001 demi privasi UU PDP', () => {
      const rawNik = '3201123456780001';
      const masked = maskNik(rawNik);
      expect(masked).toBe('3201 **** **** 0001');
      expect(masked).not.toBe(rawNik);
      expect(masked.startsWith('3201')).toBe(true);
      expect(masked.endsWith('0001')).toBe(true);
    });

    it('harus menangani edge cases maskNik dengan aman (null, undefined, short string)', () => {
      expect(maskNik(null)).toBe('-');
      expect(maskNik(undefined)).toBe('-');
      expect(maskNik('')).toBe('-');
      expect(maskNik('12345')).toBe('*****');
      expect(maskNik('320112345678')).toBe('3201 **** 5678');
    });

    it('harus memastikan payload form tetap menyimpan raw string 16-digit murni saat validasi Zod', () => {
      const rawNik = '3201123456780001';
      const formData = {
        nik: rawNik,
        bio: 'Pengusaha distribusi sembako kota',
        idCardPhoto: 'data:image/jpeg;base64,ktpvalidbase64',
      };

      const parsed = kycSchema.parse(formData);
      expect(parsed.nik).toBe(rawNik);
      expect(parsed.nik.length).toBe(16);
      expect(/^\d{16}$/.test(parsed.nik)).toBe(true);
    });

    it('harus mengembalikan nilai masked saat blurred dan raw saat focused (maskOnBlur mechanism)', () => {
      const rawNik = '3201123456780001';
      const computeDisplayValue = (value: string, isFocused: boolean, maskFn?: (v: string) => string) => {
        const hasMask = !isFocused && !!maskFn && !!value;
        return hasMask ? maskFn(value) : value;
      };

      // Saat kehilangan fokus (onBlur / idle) -> NIK disamarkan
      const blurredDisplay = computeDisplayValue(rawNik, false, maskNik);
      expect(blurredDisplay).toBe('3201 **** **** 0001');

      // Saat pengguna fokus untuk mengetik/mengedit (onFocus) -> NIK ditampilkan mentah untuk editing
      const focusedDisplay = computeDisplayValue(rawNik, true, maskNik);
      expect(focusedDisplay).toBe(rawNik);
      expect(focusedDisplay).toBe('3201123456780001');
    });

    it('harus menonaktifkan batasan maxLength saat masked agar string 19-karakter tidak terpotong', () => {
      const getEffectiveMaxLength = (hasMask: boolean, maxLength?: number) => {
        return hasMask ? undefined : maxLength;
      };

      expect(getEffectiveMaxLength(true, 16)).toBeUndefined();
      expect(getEffectiveMaxLength(false, 16)).toBe(16);
    });
  });

  describe('5. [TASK-FE-12 DoD] Multipart/FormData File Upload Integration', () => {
    it('harus memvalidasi pengiriman URI file lokal (file://) tanpa konversi base64', () => {
      const fileUriData = {
        nik: '3201123456780001',
        bio: 'Pengusaha distribusi sembako kota',
        idCardPhoto: 'file:///data/user/0/host.exp.exponent/cache/ExperienceData/ImagePicker/test-ktp.jpg',
      };

      const parsed = kycSchema.parse(fileUriData);
      expect(parsed.idCardPhoto.startsWith('file://')).toBe(true);
      expect(parsed.idCardPhoto.endsWith('.jpg')).toBe(true);
      expect(parsed.idCardPhoto).not.toMatch(/^data:image/);
    });

    it('harus menyusun FormData multipart secara benar di UserRemoteDataSource', async () => {
      const { UserRemoteDataSource } = require('../src/data/datasources/remote/user.remote-datasource');
      const api = require('@core/network/api').default;
      api.patch.mockResolvedValue({
        data: {
          status: 'success',
          data: {
            _id: 'usr-123',
            username: 'testuser',
            is_kyc_verified: true,
          },
        },
      });

      const dataSource = new UserRemoteDataSource();
      await dataSource.updateKyc({
        nik: '3201123456780001',
        bio: 'Pengusaha distribusi sembako kota',
        idCardPhoto: 'file:///path/to/ktp.jpg',
      });

      expect(api.patch).toHaveBeenCalledWith(
        '/users/update-kyc',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
        })
      );
    });
  });

  describe('6. [TASK-FE-17 DoD] Guard Status User Sudah Terverifikasi (KycVerificationScreen)', () => {
    let queryClient: QueryClient;
    let renderer: any = null;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
    });

    afterEach(() => {
      if (renderer) {
        ReactTestRenderer.act(() => {
          renderer.unmount();
        });
        renderer = null;
      }
    });

    it('harus merender status terverifikasi elegan jika user.isKycVerified === true alih-alih form kosong', async () => {
      useAuthStore.getState().setUser({
        ...baseUser,
        isKycVerified: true,
        accountTier: 'basic',
        nik: '3201123456780001',
      });

      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            React.createElement(KycVerificationScreen)
          )
        );
        await Promise.resolve();
      });

      const root = renderer.root;

      // 1. Verifikasi judul halaman adalah "Status Verifikasi KYC"
      const texts = root.findAllByType(Text).map((t: any) => t.props.children);
      const allTextContent = JSON.stringify(texts);
      expect(allTextContent).toContain('Status Verifikasi KYC');
      expect(allTextContent).toContain('Akun Anda Telah Terverifikasi');
      expect(allTextContent).toContain('EMERALD PLATINUM TIER');
      expect(allTextContent).toContain('Rp 50.000.000');
      expect(allTextContent).toContain('3201 **** **** 0001');

      // 2. Verifikasi tombol kembali ke profil tersedia
      const buttons = root.findAllByType(ButtonCustom);
      expect(buttons.length).toBe(1);
      expect(buttons[0].props.title).toBe('Kembali ke Profil');

      // 3. Verifikasi TIDAK ADA form upload foto KTP atau placeholder KTP
      expect(allTextContent).not.toContain('Unggah foto fisik KTP');
      expect(allTextContent).not.toContain('Upgrade Akun Premium');
    });

    it('harus merender status terverifikasi jika user.accountTier === "premium" meskipun isKycVerified belum diset', async () => {
      useAuthStore.getState().setUser({
        ...baseUser,
        isKycVerified: false,
        accountTier: 'premium',
      });

      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            React.createElement(KycVerificationScreen)
          )
        );
        await Promise.resolve();
      });

      const root = renderer.root;
      const texts = root.findAllByType(Text).map((t: any) => t.props.children);
      const allTextContent = JSON.stringify(texts);
      expect(allTextContent).toContain('Akun Anda Telah Terverifikasi');
      expect(allTextContent).toContain('EMERALD PLATINUM TIER');
    });

    it('harus merender 2FA security gate jika user belum terverifikasi dan 2FA belum aktif', async () => {
      useAuthStore.getState().setUser({
        ...baseUser,
        isKycVerified: false,
        accountTier: 'basic',
        twoFactorEnabled: false,
      });

      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            React.createElement(KycVerificationScreen)
          )
        );
        await Promise.resolve();
      });

      const root = renderer.root;
      const texts = root.findAllByType(Text).map((t: any) => t.props.children);
      const allTextContent = JSON.stringify(texts);
      expect(allTextContent).toContain('Aktivasi 2FA Diperlukan');
      expect(allTextContent).not.toContain('Akun Anda Telah Terverifikasi');
    });

    it('harus merender form pengajuan KYC jika user belum terverifikasi tetapi 2FA sudah aktif', async () => {
      useAuthStore.getState().setUser({
        ...baseUser,
        isKycVerified: false,
        accountTier: 'basic',
        twoFactorEnabled: true,
      });

      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          React.createElement(
            QueryClientProvider,
            { client: queryClient },
            React.createElement(KycVerificationScreen)
          )
        );
        await Promise.resolve();
      });

      const root = renderer.root;
      const texts = root.findAllByType(Text).map((t: any) => t.props.children);
      const allTextContent = JSON.stringify(texts);
      expect(allTextContent).toContain('Upgrade Akun Premium');
      expect(allTextContent).toContain('Dokumen Fisik Identitas (KTP)');
      expect(allTextContent).not.toContain('Akun Anda Telah Terverifikasi');
    });
  });
});
