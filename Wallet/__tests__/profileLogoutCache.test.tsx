import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ProfileScreen from '../src/features/user/screens/ProfileScreen';
import { useAuthStore } from '../src/core/storage/useAuthStore';
import { useFeedbackStore } from '../src/core/feedback/feedback.store';
import { ButtonCustom } from '../src/shared/components';
import { User } from '../src/domain/entities/user';

// Navigation Mocks
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
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
    clearSession: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../src/core/security/biometrics.service', () => ({
  BiometricsService: {
    isAvailable: jest.fn().mockResolvedValue(false),
    authenticate: jest.fn().mockResolvedValue(false),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 24, left: 0, right: 0 }),
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

// DI Container Mocks
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

const mockUser: User = {
  id: 'usr-logout-01',
  username: 'cynthia_tan',
  email: 'cynthia@example.com',
  phoneNumber: '081122334455',
  role: 'user',
  isVerified: true,
  isSuspended: false,
  twoFactorEnabled: true,
  avatar: null,
  nik: '3201998877660001',
  balance: 5000000,
  isEmailVerified: true,
  isKycVerified: true,
  accountTier: 'premium',
  hasPin: true,
};

describe('TASK-FE-19: ProfileScreen Logout + TanStack Query Cache Clear Integration Tests', () => {
  let queryClient: QueryClient;
  let renderer: any = null;

  beforeEach(() => {
    jest.clearAllMocks();
    useFeedbackStore.setState({ dialog: null, toast: null, dialogQueue: [] });
    useAuthStore.setState({
      user: mockUser,
      token: 'token-active-123',
      isAuthenticated: true,
      isBiometricsEnabled: false,
    });

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
    queryClient.clear();
  });

  it('1. [DoD] Mengosongkan seluruh memori query cache saat pengguna keluar akun dari ProfileScreen', async () => {
    // 1. Populasi cache TanStack Query dengan data sensitif pengguna
    queryClient.setQueryData(['user', 'profile'], {
      id: mockUser.id,
      email: mockUser.email,
      nik: mockUser.nik,
    });
    queryClient.setQueryData(['transactions', 'history'], [
      { id: 'tx-1', amount: 500000, description: 'Topup Bank Transfer' },
      { id: 'tx-2', amount: 150000, description: 'Transfer ke Rekan' },
    ]);
    queryClient.setQueryData(['wallet', 'balance'], {
      balance: 5000000,
      currency: 'IDR',
    });

    // Verifikasi bahwa data tersimpan di cache sebelum logout
    expect(queryClient.getQueryData(['user', 'profile'])).toBeDefined();
    expect(queryClient.getQueryData(['transactions', 'history'])).toBeDefined();
    expect(queryClient.getQueryData(['wallet', 'balance'])).toBeDefined();
    expect(queryClient.getQueryCache().getAll().length).toBe(3);

    // 2. Render ProfileScreen di bawah QueryClientProvider
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <ProfileScreen />
        </QueryClientProvider>
      );
      await Promise.resolve();
    });

    // 3. Temukan dan tekan tombol "Keluar Akun"
    const logoutButton = renderer.root
      .findAllByType(ButtonCustom)
      .find((btn: any) => btn.props.title === 'Keluar Akun');
    expect(logoutButton).toBeDefined();

    ReactTestRenderer.act(() => {
      logoutButton.props.onPress();
    });

    // 4. Verifikasi kemunculan modal dialog konfirmasi destruktif
    const dialogState = useFeedbackStore.getState().dialog;
    expect(dialogState).not.toBeNull();
    expect(dialogState?.title).toBe('Keluar dari Akun');
    expect(dialogState?.isDestructive).toBe(true);

    // 5. Konfirmasi dialog keluar akun (menjalankan onConfirm)
    await ReactTestRenderer.act(async () => {
      await dialogState?.onConfirm?.();
      await Promise.resolve();
    });

    // 6. [DoD Verification] Verifikasi SELURUH data cache TanStack Query telah dibersihkan total
    expect(queryClient.getQueryData(['user', 'profile'])).toBeUndefined();
    expect(queryClient.getQueryData(['transactions', 'history'])).toBeUndefined();
    expect(queryClient.getQueryData(['wallet', 'balance'])).toBeUndefined();
    expect(queryClient.getQueryCache().getAll().length).toBe(0);

    // 7. Verifikasi sesi authStore juga telah dinonaktifkan
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
