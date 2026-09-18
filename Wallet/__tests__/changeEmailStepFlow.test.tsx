import React from 'react';
import { TouchableOpacity, View, Text, TextInput } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ChangeEmailScreen from '../src/features/user/screens/ChangeEmailScreen';
import { useFeedbackStore } from '../src/core/feedback/feedback.store';
import { useAuthStore } from '../src/core/storage/useAuthStore';
import { ButtonCustom } from '../src/shared/components';

// Mocks
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
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

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
  setStatusBarStyle: jest.fn(),
  setStatusBarHidden: jest.fn(),
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

jest.mock('expo-screen-capture', () => ({
  preventScreenCaptureAsync: jest.fn().mockResolvedValue(true),
  allowScreenCaptureAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/core/security/useScreenGuard', () => ({
  useScreenGuard: jest.fn(),
}));

jest.mock('../src/core/security/biometrics.service', () => ({
  BiometricsService: {
    isAvailable: jest.fn().mockResolvedValue(false),
    authenticate: jest.fn().mockResolvedValue(false),
  },
}));

jest.mock('../src/core/security/secureStorage.service', () => ({
  secureStorageService: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    clearSession: jest.fn(),
  },
}));

const mockRequestChangeEmailOtp = jest.fn();
const mockUpdateEmail = jest.fn();

jest.mock('../src/core/di/container', () => ({
  userRepository: {
    requestChangeEmailOtp: (...args: any[]) => mockRequestChangeEmailOtp(...args),
    updateEmail: (...args: any[]) => mockUpdateEmail(...args),
    getProfile: jest.fn(),
    setupPin: jest.fn(),
    updatePassword: jest.fn(),
    updatePin: jest.fn(),
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

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('TASK-FE-10: ChangeEmailScreen 2-Step OTP Flow Unit & Integration Tests', () => {
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

    useAuthStore.setState({
      user: {
        id: 'usr-001',
        username: 'Budi Test',
        email: 'budi.lama@domain.com',
        phoneNumber: '08123456789',
        role: 'user',
        isVerified: true,
        isSuspended: false,
        twoFactorEnabled: false,
        avatar: null,
        nik: '3171000000000001',
        balance: 500000,
        isEmailVerified: true,
        isKycVerified: true,
        accountTier: 'basic',
        hasPin: true,
        idCardPhoto: null,
        bio: '',
      },
      isAuthenticated: true,
      isBiometricsEnabled: false,
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

  const renderComponent = async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <ChangeEmailScreen />
        </QueryClientProvider>
      );
      await Promise.resolve();
    });
    return renderer;
  };

  it('1. [DoD Step 1 Render] Harus merender form Step 1 (Email Baru & PIN) dan tombol "Kirim Kode OTP"', async () => {
    const root = await renderComponent();

    // Verifikasi tombol Kirim Kode OTP tersedia
    const buttons = root.root.findAllByType(ButtonCustom);
    expect(buttons.length).toBe(1);
    expect(buttons[0].props.title).toBe('Kirim Kode OTP');

    // Verifikasi ada 2 TextInput di Step 1 (email dan pin)
    const inputs = root.root.findAllByType(TextInput);
    expect(inputs.length).toBe(2);
    expect(inputs[0].props.placeholder).toBe('nama@domain.com');
    expect(inputs[1].props.placeholder).toBe('6 Digit PIN Keamanan');
  });

  it('2. [DoD Validasi Step 1] Menekan "Kirim Kode OTP" dengan data kosong/invalid tidak boleh memanggil requestOtp', async () => {
    const root = await renderComponent();

    const sendOtpButton = root.root.findByType(ButtonCustom);

    await ReactTestRenderer.act(async () => {
      sendOtpButton.props.onPress();
      await Promise.resolve();
    });

    expect(mockRequestChangeEmailOtp).not.toHaveBeenCalled();

    // Pastikan tetap berada di Step 1
    const buttons = root.root.findAllByType(ButtonCustom);
    expect(buttons[0].props.title).toBe('Kirim Kode OTP');
  });

  it('3. [DoD Transisi Step 1 ke Step 2] Menginput email valid + PIN dan menekan "Kirim Kode OTP" berhasil berpindah ke Step 2', async () => {
    mockRequestChangeEmailOtp.mockResolvedValueOnce({
      status: 'success',
      message: 'Kode OTP verifikasi berhasil dikirimkan ke email baru Anda.',
      two_factor: false,
    });

    const root = await renderComponent();

    const inputs = root.root.findAllByType(TextInput);
    const emailInput = inputs[0];
    const pinInput = inputs[1];

    // Isi email baru dan PIN valid
    await ReactTestRenderer.act(async () => {
      emailInput.props.onChangeText('budi.baru@domain.com');
      pinInput.props.onChangeText('123456');
      await Promise.resolve();
    });

    const sendOtpButton = root.root.findByType(ButtonCustom);

    await ReactTestRenderer.act(async () => {
      sendOtpButton.props.onPress();
      await Promise.resolve();
    });

    // Verifikasi repository terpanggil dengan parameter email baru
    expect(mockRequestChangeEmailOtp).toHaveBeenCalledWith('budi.baru@domain.com');

    // Verifikasi toast terpicu
    const toastState = useFeedbackStore.getState().toast;
    expect(toastState).not.toBeNull();
    expect(toastState?.type).toBe('success');

    // Verifikasi sekarang berpindah ke Step 2
    const step2Buttons = root.root.findAllByType(ButtonCustom);
    expect(step2Buttons[0].props.title).toBe('Konfirmasi Pembaruan Email');

    // Verifikasi ada input OTP di Step 2
    const step2Inputs = root.root.findAllByType(TextInput);
    expect(step2Inputs.length).toBe(1);
    expect(step2Inputs[0].props.placeholder).toBe('6 Digit OTP');
  });

  it('4. [DoD Navigasi Kembali dari Step 2 ke Step 1] Menekan tombol "Ubah Email atau PIN" mengembalikan tampilan ke Step 1', async () => {
    mockRequestChangeEmailOtp.mockResolvedValueOnce({
      status: 'success',
      message: 'Kode OTP terkirim',
      two_factor: false,
    });

    const root = await renderComponent();

    const inputs = root.root.findAllByType(TextInput);
    await ReactTestRenderer.act(async () => {
      inputs[0].props.onChangeText('budi.baru@domain.com');
      inputs[1].props.onChangeText('123456');
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      root.root.findByType(ButtonCustom).props.onPress();
      await Promise.resolve();
    });

    // Cari touchable "Ubah Email atau PIN"
    const touchables = root.root.findAllByType(TouchableOpacity);
    const changeInfoTouchable = touchables.find((t: any) =>
      t.props.children?.props?.children === 'Ubah Email atau PIN'
    );
    expect(changeInfoTouchable).toBeDefined();

    await ReactTestRenderer.act(async () => {
      changeInfoTouchable.props.onPress();
      await Promise.resolve();
    });

    // Harus kembali ke Step 1
    const buttons = root.root.findAllByType(ButtonCustom);
    expect(buttons[0].props.title).toBe('Kirim Kode OTP');
  });

  it('5. [DoD Step 2 Final Submission] Memasukkan OTP 6-digit dan konfirmasi memanggil updateEmail dengan parameter lengkap', async () => {
    mockRequestChangeEmailOtp.mockResolvedValueOnce({
      status: 'success',
      message: 'Kode OTP terkirim',
      two_factor: false,
    });

    mockUpdateEmail.mockResolvedValueOnce({
      email: 'budi.baru@domain.com',
    });

    const root = await renderComponent();

    // Step 1 input & submit
    const inputs = root.root.findAllByType(TextInput);
    await ReactTestRenderer.act(async () => {
      inputs[0].props.onChangeText('budi.baru@domain.com');
      inputs[1].props.onChangeText('654321');
      await Promise.resolve();
    });

    await ReactTestRenderer.act(async () => {
      root.root.findByType(ButtonCustom).props.onPress();
      await Promise.resolve();
    });

    // Step 2: input OTP
    const otpInput = root.root.findByType(TextInput);
    await ReactTestRenderer.act(async () => {
      otpInput.props.onChangeText('112233');
      await Promise.resolve();
    });

    // Submit Step 2
    const confirmButton = root.root.findByType(ButtonCustom);
    await ReactTestRenderer.act(async () => {
      confirmButton.props.onPress();
      await Promise.resolve();
    });

    // Verifikasi updateEmail terpanggil dengan seluruh parameter yang dikumpulkan dari 2 step
    expect(mockUpdateEmail).toHaveBeenCalledWith('budi.baru@domain.com', '112233', '654321');

    // Verifikasi feedback dialog sukses muncul
    const dialogState = useFeedbackStore.getState().dialog;
    expect(dialogState).not.toBeNull();
    expect(dialogState?.title).toBe('Email Berhasil Diperbarui');
  });
});
