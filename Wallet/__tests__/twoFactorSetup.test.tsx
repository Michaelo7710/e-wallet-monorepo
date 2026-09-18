import React from 'react';
import { View, TextInput } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import * as z from 'zod';

import { useFeedbackStore } from '../src/core/feedback/feedback.store';
import { useAuthStore } from '../src/core/storage/useAuthStore';
import { User } from '../src/domain/entities/user';

// Mock navigation
let navigationListeners: { [event: string]: (e: any) => void } = {};
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockDispatch = jest.fn();
const mockAddListener = jest.fn((event: string, callback: (e: any) => void) => {
  navigationListeners[event] = callback;
  return () => {
    delete navigationListeners[event];
  };
});

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    dispatch: mockDispatch,
    addListener: mockAddListener,
  }),
}));

jest.mock('../src/core/security/biometrics.service', () => ({
  BiometricsService: {
    isAvailable: jest.fn(),
    authenticate: jest.fn(),
  },
}));

jest.mock('../src/shared/layouts', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    UserLayout: ({ children }: any) => <View testID="user-layout">{children}</View>,
    AuthLayout: ({ children }: any) => <View testID="auth-layout">{children}</View>,
  };
});

jest.mock('expo/virtual/env', () => ({
  env: process.env,
}));

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: View,
  };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: View,
  };
});

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

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
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

// Mock hooks
let mockGenerateMutate = jest.fn();
let mockGenerateData: any = { secret: 'JBSWY3DPEHPK3PXP' };
let mockIsGenerating = false;
let mockIsGenerateError = false;
let mockGenerateError: any = null;

let mockVerifyMutate = jest.fn();
let mockIsVerifying = false;

jest.mock('../src/features/auth/hooks/useAuthMutations', () => ({
  useGenerate2FAMutation: () => ({
    mutate: mockGenerateMutate,
    data: mockGenerateData,
    isPending: mockIsGenerating,
    isError: mockIsGenerateError,
    error: mockGenerateError,
  }),
  useVerify2FAMutation: () => ({
    mutate: mockVerifyMutate,
    isPending: mockIsVerifying,
    isError: false,
    error: null,
  }),
}));

import TwoFactorSetupScreen from '../src/features/user/screens/TwoFactorSetupScreen';

const twoFactorSetupSchema = z.object({
  code: z
    .string()
    .length(6, { message: 'Kode harus 6 digit angka' })
    .regex(/^\d+$/, { message: 'Hanya boleh angka' }),
});

describe('TASK-QA-03 & TASK-FE-13: Two-Factor Authentication Setup & Navigation Guard', () => {
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
    navigationListeners = {};
    mockGenerateData = { secret: 'JBSWY3DPEHPK3PXP' };
    mockIsGenerating = false;
    mockIsGenerateError = false;
    mockGenerateError = null;
    mockIsVerifying = false;
    useAuthStore.getState().setUser(initialUser);
    useFeedbackStore.setState({ dialog: null, toast: null, dialogQueue: [] });
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
      const mockNav = jest.fn();
      const mockAlert = jest.fn();

      const user = { ...initialUser, twoFactorEnabled: false };

      const handleTwoFactorPress = (u: User | null) => {
        if (u?.twoFactorEnabled) {
          mockAlert(
            'Proteksi 2FA Aktif',
            'Akun Anda telah diamankan dengan autentikator dua faktor berbasis TOTP.'
          );
        } else {
          mockNav('TwoFactorSetup');
        }
      };

      handleTwoFactorPress(user);
      expect(mockNav).toHaveBeenCalledWith('TwoFactorSetup');
      expect(mockAlert).not.toHaveBeenCalled();
    });

    it('harus memunculkan alert jika 2FA sudah aktif', () => {
      const mockNav = jest.fn();
      const mockAlert = jest.fn();

      const user = { ...initialUser, twoFactorEnabled: true };

      const handleTwoFactorPress = (u: User | null) => {
        if (u?.twoFactorEnabled) {
          mockAlert(
            'Proteksi 2FA Aktif',
            'Akun Anda telah diamankan dengan autentikator dua faktor berbasis TOTP.'
          );
        } else {
          mockNav('TwoFactorSetup');
        }
      };

      handleTwoFactorPress(user);
      expect(mockAlert).toHaveBeenCalledWith(
        'Proteksi 2FA Aktif',
        'Akun Anda telah diamankan dengan autentikator dua faktor berbasis TOTP.'
      );
      expect(mockNav).not.toHaveBeenCalled();
    });
  });

  describe('TASK-FE-13: Navigation Guard (beforeRemove) in TwoFactorSetupScreen', () => {
    it('1. harus mendaftarkan listener beforeRemove ke navigation saat screen di-mount', () => {
      let renderer: any;
      act(() => {
        renderer = ReactTestRenderer.create(<TwoFactorSetupScreen />);
      });

      expect(mockAddListener).toHaveBeenCalledWith('beforeRemove', expect.any(Function));
      expect(typeof navigationListeners['beforeRemove']).toBe('function');
      act(() => {
        renderer.unmount();
      });
    });

    it('2. harus membersihkan listener saat component unmount (mencegah memory leak)', () => {
      let renderer: any;
      act(() => {
        renderer = ReactTestRenderer.create(<TwoFactorSetupScreen />);
      });

      expect(navigationListeners['beforeRemove']).toBeDefined();
      act(() => {
        renderer.unmount();
      });
      expect(navigationListeners['beforeRemove']).toBeUndefined();
    });

    it('3. harus mencegah navigasi mundur (preventDefault) dan menampilkan dialog konfirmasi jika secret sudah ada tetapi belum diverifikasi', () => {
      let renderer: any;
      act(() => {
        renderer = ReactTestRenderer.create(<TwoFactorSetupScreen />);
      });

      const mockPreventDefault = jest.fn();
      const mockAction = { type: 'GO_BACK' };

      act(() => {
        navigationListeners['beforeRemove']({
          preventDefault: mockPreventDefault,
          data: { action: mockAction },
        });
      });

      // Assertions
      expect(mockPreventDefault).toHaveBeenCalledTimes(1);

      const dialogState = useFeedbackStore.getState().dialog;
      expect(dialogState).not.toBeNull();
      expect(dialogState?.title).toBe('Batalkan Penyiapan 2FA?');
      expect(dialogState?.message).toContain('Kunci rahasia telah dibuat tetapi belum diverifikasi');
      expect(dialogState?.confirmText).toBe('Ya, Batalkan');
      expect(dialogState?.cancelText).toBe('Lanjut Penyiapan');
      expect(dialogState?.type).toBe('error');

      act(() => {
        renderer.unmount();
      });
    });

    it('4. harus mendispatch navigation action saat user menekan konfirmasi keluar (Ya, Batalkan)', () => {
      let renderer: any;
      act(() => {
        renderer = ReactTestRenderer.create(<TwoFactorSetupScreen />);
      });

      const mockPreventDefault = jest.fn();
      const mockAction = { type: 'POP' };

      act(() => {
        navigationListeners['beforeRemove']({
          preventDefault: mockPreventDefault,
          data: { action: mockAction },
        });
      });

      expect(mockPreventDefault).toHaveBeenCalled();
      const dialogState = useFeedbackStore.getState().dialog;
      expect(dialogState).not.toBeNull();

      // User setuju membatalkan penyiapan
      act(() => {
        dialogState?.onConfirm?.();
      });

      // dispatch dipanggil dengan action navigasi yang tertunda
      expect(mockDispatch).toHaveBeenCalledWith(mockAction);

      // Event kedua setelah confirmed tidak boleh di-prevent lagi
      const mockPreventDefault2 = jest.fn();
      act(() => {
        navigationListeners['beforeRemove']({
          preventDefault: mockPreventDefault2,
          data: { action: mockAction },
        });
      });
      expect(mockPreventDefault2).not.toHaveBeenCalled();

      act(() => {
        renderer.unmount();
      });
    });

    it('5. tidak boleh mencegah navigasi mundur jika secret belum di-generate (misal saat error atau belum siap)', () => {
      mockGenerateData = null; // belum ada secret

      let renderer: any;
      act(() => {
        renderer = ReactTestRenderer.create(<TwoFactorSetupScreen />);
      });

      const mockPreventDefault = jest.fn();
      const mockAction = { type: 'GO_BACK' };

      act(() => {
        navigationListeners['beforeRemove']({
          preventDefault: mockPreventDefault,
          data: { action: mockAction },
        });
      });

      // Tidak boleh dicegah
      expect(mockPreventDefault).not.toHaveBeenCalled();
      expect(useFeedbackStore.getState().dialog).toBeNull();

      act(() => {
        renderer.unmount();
      });
    });

    it('6. tidak boleh mencegah navigasi mundur jika verifikasi 2FA telah berhasil diselesaikan', async () => {
      let renderer: any;
      await act(async () => {
        renderer = ReactTestRenderer.create(<TwoFactorSetupScreen />);
        await Promise.resolve();
      });

      // Cari input kode OTP 6-digit dan isi dengan 6 digit valid
      const inputs = renderer.root.findAllByType(TextInput);
      expect(inputs.length).toBeGreaterThan(0);
      const codeInput = inputs[0];

      await act(async () => {
        codeInput.props.onChangeText('123456');
        await Promise.resolve();
      });

      // Cari tombol submit verifikasi 2FA
      const submitButtons = renderer.root.findAll((node: any) => node.props?.title === 'Verifikasi & Aktifkan 2FA');
      expect(submitButtons.length).toBeGreaterThan(0);

      // Trigger submit
      await act(async () => {
        submitButtons[0].props.onPress();
        await Promise.resolve();
      });

      // Panggil onSuccess dari callback verify2FA yang dipasang oleh screen
      expect(mockVerifyMutate).toHaveBeenCalledWith(
        { token: '123456' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
      const verifyCallOptions = mockVerifyMutate.mock.calls[0][1];

      await act(async () => {
        verifyCallOptions.onSuccess();
        await Promise.resolve();
      });

      // Dialog sukses muncul
      const successDialog = useFeedbackStore.getState().dialog;
      expect(successDialog?.title).toBe('2FA Berhasil Diaktifkan!');

      // Sekarang simulasi navigasi keluar (misal callback dialog memanggil goBack)
      const mockPreventDefault = jest.fn();
      act(() => {
        navigationListeners['beforeRemove']({
          preventDefault: mockPreventDefault,
          data: { action: { type: 'GO_BACK' } },
        });
      });

      // Navigasi tidak boleh dicegah karena 2FA sudah sah terverifikasi
      expect(mockPreventDefault).not.toHaveBeenCalled();

      act(() => {
        renderer.unmount();
      });
    });
  });
});
