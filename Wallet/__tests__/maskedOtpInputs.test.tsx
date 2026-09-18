import React from 'react';
import { View, TextInput } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ChangeEmailScreen from '../src/features/user/screens/ChangeEmailScreen';
import ChangePinScreen from '../src/features/user/screens/ChangePinScreen';
import { ControlledInput, ButtonCustom } from '../src/shared/components';
import { useFeedbackStore } from '../src/core/feedback/feedback.store';
import { useAuthStore } from '../src/core/storage/useAuthStore';
import { User } from '../src/domain/entities/user';

// Mocks
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    addListener: jest.fn(() => jest.fn()),
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
const mockUpdatePin = jest.fn();

jest.mock('../src/core/di/container', () => ({
  userRepository: {
    requestChangeEmailOtp: (...args: any[]) => mockRequestChangeEmailOtp(...args),
    updateEmail: (...args: any[]) => mockUpdateEmail(...args),
    updatePin: (...args: any[]) => mockUpdatePin(...args),
    getProfile: jest.fn(),
    setupPin: jest.fn(),
    updatePassword: jest.fn(),
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

describe('TASK-FE-14: Masking OTP field di ChangeEmailScreen & ChangePinScreen', () => {
  let queryClient: QueryClient;

  const mockUser: User = {
    id: 'usr-otp-01',
    username: 'masked_user',
    email: 'user@example.com',
    phoneNumber: '08123456789',
    role: 'user',
    isVerified: true,
    isSuspended: false,
    twoFactorEnabled: false,
    avatar: null,
    nik: '3201123456780001',
    balance: 5000000,
    isEmailVerified: true,
    isKycVerified: false,
    accountTier: 'basic',
    hasPin: true,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    useFeedbackStore.setState({ dialog: null, toast: null, dialogQueue: [] });
    useAuthStore.getState().setUser(mockUser);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('ChangeEmailScreen OTP Field Masking (Anti-Shoulder Surfing)', () => {
    it('1. Field OTP pada Step 2 ChangeEmailScreen harus memiliki properti isPassword={true} dan secureTextEntry={true}', async () => {
      mockRequestChangeEmailOtp.mockResolvedValueOnce({
        status: 'success',
        message: 'Kode OTP terkirim',
        two_factor: false,
      });

      let root: any;
      await act(async () => {
        root = ReactTestRenderer.create(
          <QueryClientProvider client={queryClient}>
            <ChangeEmailScreen />
          </QueryClientProvider>
        );
        await Promise.resolve();
      });

      // Step 1: Masukkan data valid lalu pindah ke Step 2
      const step1Inputs = root.root.findAllByType(TextInput);
      await act(async () => {
        step1Inputs[0].props.onChangeText('new.email@example.com');
        step1Inputs[1].props.onChangeText('123456');
        await Promise.resolve();
      });

      const sendOtpButton = root.root.findByType(ButtonCustom);
      await act(async () => {
        sendOtpButton.props.onPress();
        await Promise.resolve();
      });

      // Verifikasi komponen ControlledInput untuk "otp" ter-masking
      const controlledInputs = root.root.findAllByType(ControlledInput);
      const otpControlledInput = controlledInputs.find((input: any) => input.props.name === 'otp');

      expect(otpControlledInput).toBeDefined();
      expect(otpControlledInput.props.isPassword).toBe(true);

      // Verifikasi TextInput di dalam Step 2 memiliki secureTextEntry aktif
      const step2Inputs = root.root.findAllByType(TextInput);
      expect(step2Inputs.length).toBe(1);
      expect(step2Inputs[0].props.secureTextEntry).toBe(true);
      expect(step2Inputs[0].props.placeholder).toBe('6 Digit OTP');

      act(() => {
        root.unmount();
      });
    });
  });

  describe('ChangePinScreen OTP Field Masking (Anti-Shoulder Surfing)', () => {
    it('2. Field OTP pada ChangePinScreen harus memiliki isPassword={true} dan secureTextEntry={true}', async () => {
      let root: any;
      await act(async () => {
        root = ReactTestRenderer.create(
          <QueryClientProvider client={queryClient}>
            <ChangePinScreen />
          </QueryClientProvider>
        );
        await Promise.resolve();
      });

      // Verifikasi seluruh ControlledInput pada ChangePinScreen
      const controlledInputs = root.root.findAllByType(ControlledInput);
      expect(controlledInputs.length).toBe(4);

      const oldPinInput = controlledInputs.find((i: any) => i.props.name === 'oldPin');
      const otpInput = controlledInputs.find((i: any) => i.props.name === 'otp');
      const newPinInput = controlledInputs.find((i: any) => i.props.name === 'newPin');
      const confirmNewPinInput = controlledInputs.find((i: any) => i.props.name === 'confirmNewPin');

      expect(oldPinInput).toBeDefined();
      expect(oldPinInput.props.isPassword).toBe(true);

      // Field OTP WAJIB isPassword={true} (TASK-FE-14)
      expect(otpInput).toBeDefined();
      expect(otpInput.props.isPassword).toBe(true);

      expect(newPinInput).toBeDefined();
      expect(newPinInput.props.isPassword).toBe(true);

      expect(confirmNewPinInput).toBeDefined();
      expect(confirmNewPinInput.props.isPassword).toBe(true);

      // Verifikasi seluruh TextInput fisik di-render dengan secureTextEntry={true}
      const textInputs = root.root.findAllByType(TextInput);
      expect(textInputs.length).toBe(4);

      // Input ke-2 adalah field OTP (sesuai urutan di DOM tree)
      const otpTextInput = textInputs[1];
      expect(otpTextInput.props.placeholder).toBe('6 Digit OTP');
      expect(otpTextInput.props.secureTextEntry).toBe(true);

      act(() => {
        root.unmount();
      });
    });
  });
});
