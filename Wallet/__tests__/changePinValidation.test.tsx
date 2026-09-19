import React from 'react';
import { TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ChangePinScreen, {
  changePinSchema,
} from '../src/features/user/screens/ChangePinScreen';
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
const mockUpdatePin = jest.fn();
jest.mock('../src/core/di/container', () => ({
  userRepository: {
    updatePin: (...args: any[]) => mockUpdatePin(...args),
    getProfile: jest.fn(),
    setupPin: jest.fn(),
    updatePassword: jest.fn(),
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

describe('TASK-FE-16: ChangePinScreen "PIN Baru ≠ PIN Lama" Validation Tests', () => {
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
  describe('Zod Schema Unit Tests (changePinSchema)', () => {
    it('1.1. Harus menolak jika seluruh input PIN dan OTP kosong', () => {
      const result = changePinSchema.safeParse({
        oldPin: '',
        otp: '',
        newPin: '',
        confirmNewPin: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        expect(issues.some((i) => i.path.includes('oldPin'))).toBe(true);
        expect(issues.some((i) => i.path.includes('otp'))).toBe(true);
        expect(issues.some((i) => i.path.includes('newPin'))).toBe(true);
      }
    });

    it('1.2. Harus menolak jika panjang PIN baru bukan 6 digit', () => {
      const result = changePinSchema.safeParse({
        oldPin: '123456',
        otp: '112233',
        newPin: '12345',
        confirmNewPin: '12345',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('newPin'));
        expect(issue?.message).toBe('PIN baru harus 6 digit angka');
      }
    });

    it('1.3. Harus menolak jika PIN mengandung karakter non-angka', () => {
      const result = changePinSchema.safeParse({
        oldPin: '123456',
        otp: '112233',
        newPin: '12345a',
        confirmNewPin: '12345a',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('newPin'));
        expect(issue?.message).toBe('Hanya boleh berisi angka');
      }
    });

    it('1.4. [TASK-FE-16 DoD] Harus menolak jika PIN baru identik dengan PIN lama', () => {
      const result = changePinSchema.safeParse({
        oldPin: '654321',
        otp: '112233',
        newPin: '654321',
        confirmNewPin: '654321',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('newPin'));
        expect(issue).toBeDefined();
        expect(issue?.message).toBe('PIN baru tidak boleh sama dengan PIN lama');
      }
    });

    it('1.5. Harus menolak jika konfirmasi PIN baru tidak cocok dengan PIN baru', () => {
      const result = changePinSchema.safeParse({
        oldPin: '123456',
        otp: '112233',
        newPin: '654321',
        confirmNewPin: '654322',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('confirmNewPin'));
        expect(issue?.message).toBe('Konfirmasi PIN baru tidak cocok');
      }
    });

    it('1.6. Harus sukses jika data valid dan PIN baru berbeda dari PIN lama', () => {
      const result = changePinSchema.safeParse({
        oldPin: '123456',
        otp: '112233',
        newPin: '654321',
        confirmNewPin: '654321',
      });

      expect(result.success).toBe(true);
    });
  });

  // ========================================================
  // 2. COMPONENT & FORM INTEGRATION TESTS
  // ========================================================
  describe('ChangePinScreen Component Integration Tests', () => {
    const renderComponent = async () => {
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <QueryClientProvider client={queryClient}>
            <ChangePinScreen />
          </QueryClientProvider>
        );
        await Promise.resolve();
      });
      return renderer;
    };

    it('2.1. Harus merender 4 input field PIN/OTP dan tombol perbarui PIN', async () => {
      const root = await renderComponent();
      const inputs = root.root.findAllByType(TextInput);
      expect(inputs.length).toBe(4);

      const buttons = root.root.findAllByType(ButtonCustom);
      expect(buttons.length).toBe(1);
      expect(buttons[0].props.title).toBe('Perbarui PIN Transaksi');
    });

    it('2.2. [TASK-FE-16 DoD] Pengguna yang menginput PIN baru sama dengan PIN lama dicegat di form dan request mutation tidak dikirim', async () => {
      const root = await renderComponent();
      const inputs = root.root.findAllByType(TextInput);

      // Input oldPin, otp, newPin (identik), confirmNewPin (identik)
      await ReactTestRenderer.act(async () => {
        inputs[0].props.onChangeText('123456');
        inputs[1].props.onChangeText('998877');
        inputs[2].props.onChangeText('123456');
        inputs[3].props.onChangeText('123456');
        await Promise.resolve();
      });

      const submitButton = root.root.findByType(ButtonCustom);

      // Tekan tombol submit
      await ReactTestRenderer.act(async () => {
        submitButton.props.onPress();
        await Promise.resolve();
      });

      // Verifikasi mutation backend TIDAK pernah dipanggil
      expect(mockUpdatePin).not.toHaveBeenCalled();

      // Verifikasi dialog sukses tidak pernah muncul
      const activeDialog = useFeedbackStore.getState().dialog;
      expect(activeDialog).toBeNull();
    });

    it('2.3. Pengguna yang menginput PIN baru yang berbeda berhasil memicu mutation dan menampilkan dialog sukses', async () => {
      mockUpdatePin.mockResolvedValueOnce({ success: true });

      const root = await renderComponent();
      const inputs = root.root.findAllByType(TextInput);

      // Input oldPin, otp, newPin (berbeda), confirmNewPin
      await ReactTestRenderer.act(async () => {
        inputs[0].props.onChangeText('123456');
        inputs[1].props.onChangeText('998877');
        inputs[2].props.onChangeText('889900');
        inputs[3].props.onChangeText('889900');
        await Promise.resolve();
      });

      const submitButton = root.root.findByType(ButtonCustom);

      // Tekan tombol submit
      await ReactTestRenderer.act(async () => {
        submitButton.props.onPress();
        await Promise.resolve();
      });

      // Verifikasi mutation backend terpanggil dengan argumen yang tepat
      expect(mockUpdatePin).toHaveBeenCalledWith('123456', '998877', '889900', '889900');

      // Verifikasi dialog sukses ditampilkan
      const activeDialog = useFeedbackStore.getState().dialog;
      expect(activeDialog).not.toBeNull();
      expect(activeDialog?.type).toBe('success');
      expect(activeDialog?.title).toBe('Sukses');
      expect(activeDialog?.message).toContain('PIN transaksi Anda berhasil diperbarui');

      // Verifikasi navigasi goBack saat onConfirm dialog dipicu
      activeDialog?.onConfirm?.();
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('2.4. Menampilkan dialog error jika backend menolak request', async () => {
      mockUpdatePin.mockRejectedValueOnce({
        response: {
          data: {
            message: 'PIN lama yang Anda masukkan salah.',
          },
        },
      });

      const root = await renderComponent();
      const inputs = root.root.findAllByType(TextInput);

      await ReactTestRenderer.act(async () => {
        inputs[0].props.onChangeText('999999');
        inputs[1].props.onChangeText('112233');
        inputs[2].props.onChangeText('889900');
        inputs[3].props.onChangeText('889900');
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
      expect(activeDialog?.title).toBe('Gagal Memperbarui PIN');
      expect(activeDialog?.message).toBe('PIN lama yang Anda masukkan salah.');
    });
  });
});
