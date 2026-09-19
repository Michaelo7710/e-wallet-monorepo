import React from 'react';
import { TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ChangePasswordScreen, {
  changePasswordSchema,
} from '../src/features/user/screens/ChangePasswordScreen';
import { useFeedbackStore } from '../src/core/feedback/feedback.store';
import { ButtonCustom } from '../src/shared/components';

// Navigation Mocks
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: jest.fn(),
  }),
}));

// Expo Module Mocks
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

jest.mock('../src/core/security/secureStorage.service', () => ({
  secureStorageService: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    clearSession: jest.fn(),
  },
}));

jest.mock('../src/core/security/biometrics.service', () => ({
  BiometricsService: {
    isAvailable: jest.fn().mockResolvedValue(false),
    authenticate: jest.fn().mockResolvedValue(false),
  },
}));

// UI Layout Mocks
jest.mock('../src/shared/layouts', () => {
  const { View } = require('react-native');
  return {
    UserLayout: ({ children }: any) => <View testID="user-layout">{children}</View>,
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// API Repository Mocks
const mockUpdatePassword = jest.fn();
jest.mock('../src/core/di/container', () => ({
  userRepository: {
    updatePassword: (...args: any[]) => mockUpdatePassword(...args),
    getProfile: jest.fn(),
    setupPin: jest.fn(),
    updatePin: jest.fn(),
    updateEmail: jest.fn(),
    updateKyc: jest.fn(),
  },
  userLocalDataSource: {
    upsertProfile: jest.fn().mockResolvedValue(undefined),
    clearProfile: jest.fn().mockResolvedValue(undefined),
  },
  paymentLocalDataSource: {
    clearAll: jest.fn().mockResolvedValue(undefined),
  },
  paymentRepository: {},
  authRepository: {},
  adminRepository: {},
}));

describe('TASK-FE-15: ChangePasswordScreen "Password Baru ≠ Password Lama" Validation Tests', () => {
  let queryClient: QueryClient;
  let renderer: any = null;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    useFeedbackStore.setState({ dialog: null, toast: null, dialogQueue: [] });

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
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // ========================================================
  // 1. DIRECT ZOD SCHEMA VALIDATION TESTS
  // ========================================================
  describe('Zod Schema Unit Tests (changePasswordSchema)', () => {
    it('1.1. Harus menolak jika seluruh input password kosong', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        expect(issues.some((i) => i.path.includes('oldPassword'))).toBe(true);
        expect(issues.some((i) => i.path.includes('newPassword'))).toBe(true);
      }
    });

    it('1.2. Harus menolak jika password baru kurang dari 8 karakter', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: 'OldPassword123',
        newPassword: 'short',
        confirmNewPassword: 'short',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('newPassword'));
        expect(issue?.message).toBe('Password baru minimal 8 karakter');
      }
    });

    it('1.3. [TASK-FE-15 DoD] Harus menolak jika password baru identik dengan password lama', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: 'SecretPassword123!',
        newPassword: 'SecretPassword123!',
        confirmNewPassword: 'SecretPassword123!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('newPassword'));
        expect(issue).toBeDefined();
        expect(issue?.message).toBe('Password baru tidak boleh sama dengan password lama');
      }
    });

    it('1.4. Harus menolak jika konfirmasi password baru tidak cocok dengan password baru', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: 'OldPassword123!',
        newPassword: 'BrandNewPassword123!',
        confirmNewPassword: 'TypoPassword123!',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('confirmNewPassword'));
        expect(issue?.message).toBe('Konfirmasi password baru tidak cocok');
      }
    });

    it('1.5. Harus sukses jika password lama benar, password baru valid dan berbeda, serta konfirmasi cocok', () => {
      const result = changePasswordSchema.safeParse({
        oldPassword: 'CurrentPassword123!',
        newPassword: 'NewSecurePassword456!',
        confirmNewPassword: 'NewSecurePassword456!',
      });

      expect(result.success).toBe(true);
    });
  });

  // ========================================================
  // 2. COMPONENT & FORM INTEGRATION TESTS
  // ========================================================
  describe('ChangePasswordScreen Component Integration Tests', () => {
    const renderComponent = async () => {
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <QueryClientProvider client={queryClient}>
            <ChangePasswordScreen />
          </QueryClientProvider>
        );
        await Promise.resolve();
      });
      return renderer;
    };

    it('2.1. Harus merender 3 input field password dan tombol simpan', async () => {
      const root = await renderComponent();
      const inputs = root.root.findAllByType(TextInput);
      expect(inputs.length).toBe(3);

      const buttons = root.root.findAllByType(ButtonCustom);
      expect(buttons.length).toBe(1);
      expect(buttons[0].props.title).toBe('Simpan Kata Sandi');
    });

    it('2.2. [TASK-FE-15 DoD] Pengguna yang menginput password baru sama dengan password lama dicegat di form dan request mutation tidak dikirim', async () => {
      const root = await renderComponent();
      const inputs = root.root.findAllByType(TextInput);

      // Input kata sandi lama, baru (sama), konfirmasi (sama)
      await ReactTestRenderer.act(async () => {
        inputs[0].props.onChangeText('PasswordKuat123!');
        inputs[1].props.onChangeText('PasswordKuat123!');
        inputs[2].props.onChangeText('PasswordKuat123!');
        await Promise.resolve();
      });

      const submitButton = root.root.findByType(ButtonCustom);

      // Tekan tombol simpan
      await ReactTestRenderer.act(async () => {
        submitButton.props.onPress();
        await Promise.resolve();
      });

      // Verifikasi mutation backend TIDAK pernah dipanggil
      expect(mockUpdatePassword).not.toHaveBeenCalled();

      // Verifikasi dialog sukses tidak pernah muncul
      const activeDialog = useFeedbackStore.getState().dialog;
      expect(activeDialog).toBeNull();
    });

    it('2.3. Pengguna yang menginput password baru yang berbeda berhasil memicu mutation dan menampilkan dialog sukses', async () => {
      mockUpdatePassword.mockResolvedValueOnce({ success: true });

      const root = await renderComponent();
      const inputs = root.root.findAllByType(TextInput);

      // Input kata sandi lama dan baru yang berbeda
      await ReactTestRenderer.act(async () => {
        inputs[0].props.onChangeText('PasswordLama123!');
        inputs[1].props.onChangeText('PasswordBaruBerbeda456!');
        inputs[2].props.onChangeText('PasswordBaruBerbeda456!');
        await Promise.resolve();
      });

      const submitButton = root.root.findByType(ButtonCustom);

      // Tekan tombol simpan
      await ReactTestRenderer.act(async () => {
        submitButton.props.onPress();
        await Promise.resolve();
      });

      // Verifikasi mutation backend terpanggil dengan argumen yang benar
      expect(mockUpdatePassword).toHaveBeenCalledWith(
        'PasswordLama123!',
        'PasswordBaruBerbeda456!',
        'PasswordBaruBerbeda456!'
      );

      // Verifikasi modal feedback dialog sukses ditampilkan
      const activeDialog = useFeedbackStore.getState().dialog;
      expect(activeDialog).not.toBeNull();
      expect(activeDialog?.type).toBe('success');
      expect(activeDialog?.title).toBe('Sukses');
      expect(activeDialog?.message).toContain('Kata sandi akun Anda berhasil diperbarui');

      // Verifikasi navigasi goBack saat onConfirm dialog dipicu
      activeDialog?.onConfirm?.();
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('2.4. Menampilkan dialog error jika backend mengembalikan pesan kesalahan', async () => {
      mockUpdatePassword.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Password lama yang Anda masukkan salah.',
          },
        },
      });

      const root = await renderComponent();
      const inputs = root.root.findAllByType(TextInput);

      await ReactTestRenderer.act(async () => {
        inputs[0].props.onChangeText('SalahPassword123!');
        inputs[1].props.onChangeText('PasswordBaruValid999!');
        inputs[2].props.onChangeText('PasswordBaruValid999!');
        await Promise.resolve();
      });

      const submitButton = root.root.findByType(ButtonCustom);

      await ReactTestRenderer.act(async () => {
        submitButton.props.onPress();
        await Promise.resolve();
      });

      const activeDialog = useFeedbackStore.getState().dialog;
      expect(activeDialog).not.toBeNull();
      expect(activeDialog?.type).toBe('error');
      expect(activeDialog?.title).toBe('Gagal Mengubah Sandi');
      expect(activeDialog?.message).toBe('Password lama yang Anda masukkan salah.');
    });
  });
});
