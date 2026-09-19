import React from 'react';
import { TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import SetupPinScreen, {
  setupPinSchema,
} from '../src/features/user/screens/SetupPinScreen';
import { useAuthStore } from '../src/core/storage/useAuthStore';
import { useFeedbackStore } from '../src/core/feedback/feedback.store';
import { ButtonCustom } from '../src/shared/components';
import { User } from '../src/domain/entities/user';

// Navigation Mocks
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
const mockReplace = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
    replace: mockReplace,
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
const mockSetupPin = jest.fn();
jest.mock('../src/core/di/container', () => ({
  userRepository: {
    setupPin: (...args: any[]) => mockSetupPin(...args),
    getProfile: jest.fn(),
    updatePin: jest.fn(),
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

const mockUserWithPin: User = {
  id: 'user-pin-001',
  username: 'andi_secure',
  email: 'andi@example.com',
  phoneNumber: '081234567890',
  role: 'user',
  isVerified: true,
  isSuspended: false,
  twoFactorEnabled: true,
  avatar: null,
  nik: '3201123456780001',
  balance: 2500000,
  isEmailVerified: true,
  isKycVerified: true,
  accountTier: 'premium',
  hasPin: true,
};

const mockUserWithoutPin: User = {
  ...mockUserWithPin,
  id: 'user-no-pin-002',
  hasPin: false,
};

describe('TASK-FE-18: SetupPinScreen "PIN Sudah Ada" Guard & Activation Tests', () => {
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
  describe('1. Zod Schema Unit Tests (setupPinSchema)', () => {
    it('1.1. Harus menolak jika input PIN atau konfirmasi kosong', () => {
      const result = setupPinSchema.safeParse({
        pin: '',
        confirmPin: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues;
        expect(issues.some((i) => i.path.includes('pin'))).toBe(true);
        expect(issues.some((i) => i.path.includes('confirmPin'))).toBe(true);
      }
    });

    it('1.2. Harus menolak jika panjang PIN bukan 6 digit', () => {
      const result = setupPinSchema.safeParse({
        pin: '12345',
        confirmPin: '12345',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('pin'));
        expect(issue?.message).toBe('PIN harus 6 digit angka');
      }
    });

    it('1.3. Harus menolak jika PIN mengandung karakter non-angka', () => {
      const result = setupPinSchema.safeParse({
        pin: '12345a',
        confirmPin: '12345a',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('pin'));
        expect(issue?.message).toBe('Hanya boleh berisi angka');
      }
    });

    it('1.4. Harus menolak jika konfirmasi PIN tidak cocok', () => {
      const result = setupPinSchema.safeParse({
        pin: '123456',
        confirmPin: '654321',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes('confirmPin'));
        expect(issue?.message).toBe('Konfirmasi PIN tidak cocok');
      }
    });

    it('1.5. Harus sukses jika PIN 6 digit angka dan konfirmasi cocok', () => {
      const result = setupPinSchema.safeParse({
        pin: '123456',
        confirmPin: '123456',
      });

      expect(result.success).toBe(true);
    });
  });

  // ========================================================
  // 2. UNSET PIN SCENARIO (user.hasPin === false)
  // ========================================================
  describe('2. Skenario Pengguna Belum Memiliki PIN (user.hasPin === false)', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: mockUserWithoutPin,
        token: 'token-test',
        isAuthenticated: true,
      });
    });

    const renderComponent = async () => {
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <QueryClientProvider client={queryClient}>
            <SetupPinScreen />
          </QueryClientProvider>
        );
        await Promise.resolve();
      });
      return renderer;
    };

    it('2.1. Harus merender form aktivasi PIN dengan 2 input dan tombol submit', async () => {
      const root = await renderComponent();
      const inputs = root.root.findAllByType(TextInput);
      expect(inputs.length).toBe(2);

      const buttons = root.root.findAllByType(ButtonCustom);
      expect(buttons.length).toBe(1);
      expect(buttons[0].props.title).toBe('Simpan & Aktifkan PIN');

      // Dialog alert guard PIN aktif tidak boleh dipanggil
      const activeDialog = useFeedbackStore.getState().dialog;
      expect(activeDialog).toBeNull();
    });

    it('2.2. Berhasil mengaktifkan PIN saat form diisi valid dan navigasi goBack dipanggil', async () => {
      mockSetupPin.mockResolvedValueOnce({ status: 'success', message: 'PIN aktif' });

      const root = await renderComponent();
      const inputs = root.root.findAllByType(TextInput);

      await ReactTestRenderer.act(async () => {
        inputs[0].props.onChangeText('654321');
        inputs[1].props.onChangeText('654321');
        await Promise.resolve();
      });

      const submitButton = root.root.findByType(ButtonCustom);

      await ReactTestRenderer.act(async () => {
        submitButton.props.onPress();
        await Promise.resolve();
      });

      expect(mockSetupPin).toHaveBeenCalledWith('654321');

      const activeDialog = useFeedbackStore.getState().dialog;
      expect(activeDialog).not.toBeNull();
      expect(activeDialog?.type).toBe('success');
      expect(activeDialog?.title).toBe('PIN Berhasil Dibuat');

      activeDialog?.onConfirm?.();
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('2.3. Menampilkan dialog error jika mutasi backend gagal', async () => {
      mockSetupPin.mockRejectedValueOnce(new Error('Gagal terhubung ke server'));

      const root = await renderComponent();
      const inputs = root.root.findAllByType(TextInput);

      await ReactTestRenderer.act(async () => {
        inputs[0].props.onChangeText('654321');
        inputs[1].props.onChangeText('654321');
        await Promise.resolve();
      });

      const submitButton = root.root.findByType(ButtonCustom);

      await ReactTestRenderer.act(async () => {
        submitButton.props.onPress();
        await Promise.resolve();
      });

      expect(mockSetupPin).toHaveBeenCalledWith('654321');

      const activeDialog = useFeedbackStore.getState().dialog;
      expect(activeDialog).not.toBeNull();
      expect(activeDialog?.type).toBe('error');
      expect(activeDialog?.title).toBe('Gagal Mengatur PIN');
    });
  });

  // ========================================================
  // 3. [TASK-FE-18 DoD] ACTIVE PIN GUARD (user.hasPin === true)
  // ========================================================
  describe('3. [TASK-FE-18 DoD] Guard Skenario Pengguna Sudah Memiliki PIN (user.hasPin === true)', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: mockUserWithPin,
        token: 'token-test',
        isAuthenticated: true,
      });
    });

    const renderComponent = async () => {
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(
          <QueryClientProvider client={queryClient}>
            <SetupPinScreen />
          </QueryClientProvider>
        );
        await Promise.resolve();
      });
      return renderer;
    };

    it('3.1. [DoD] Tidak boleh merender form aktivasi PIN perdana jika PIN sudah aktif', async () => {
      const root = await renderComponent();
      const inputs = root.root.findAllByType(TextInput);

      // Seluruh input PIN/confirmPin diblokir dari rendering
      expect(inputs.length).toBe(0);
    });

    it('3.2. [DoD] Harus memunculkan modal dialog alert bahwa PIN telah aktif dan mengarahkan ke ChangePin saat konfirmasi', async () => {
      await renderComponent();

      const activeDialog = useFeedbackStore.getState().dialog;
      expect(activeDialog).not.toBeNull();
      expect(activeDialog?.title).toBe('PIN Sudah Aktif');
      expect(activeDialog?.message).toContain('Akun Anda sudah memiliki PIN transaksi aktif');

      // Eksekusi aksi onConfirm pada dialog
      await ReactTestRenderer.act(async () => {
        activeDialog?.onConfirm?.();
        await Promise.resolve();
      });

      // Verifikasi navigasi dialihkan ke ChangePin menggunakan replace
      expect(mockReplace).toHaveBeenCalledWith('ChangePin');
    });

    it('3.3. [DoD] Merender kartu status informatif "PIN Anda Telah Dikonfigurasi" dengan tombol Ubah PIN', async () => {
      const root = await renderComponent();

      // Temukan tombol "Buka Menu Ubah PIN"
      const buttons = root.root.findAllByType(ButtonCustom);
      expect(buttons.length).toBe(1);
      expect(buttons[0].props.title).toBe('Buka Menu Ubah PIN');

      // Tekan tombol "Buka Menu Ubah PIN"
      await ReactTestRenderer.act(async () => {
        buttons[0].props.onPress();
        await Promise.resolve();
      });

      expect(mockReplace).toHaveBeenCalledWith('ChangePin');
    });

    it('3.4. [DoD] Tombol kembali di header dan tombol "Kembali ke Profil" berfungsi memanggil navigation.goBack()', async () => {
      const root = await renderComponent();

      const backHeaderButton = root.root.findByProps({ accessibilityLabel: 'Kembali' });
      const backProfileButton = root.root.findByProps({ accessibilityLabel: 'Kembali ke Profil' });

      // Tekan tombol back di header
      await ReactTestRenderer.act(async () => {
        backHeaderButton.props.onPress();
        await Promise.resolve();
      });
      expect(mockGoBack).toHaveBeenCalledTimes(1);

      mockGoBack.mockClear();

      // Tekan tombol "Kembali ke Profil" di bawah kartu
      await ReactTestRenderer.act(async () => {
        backProfileButton.props.onPress();
        await Promise.resolve();
      });
      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });
  });
});
