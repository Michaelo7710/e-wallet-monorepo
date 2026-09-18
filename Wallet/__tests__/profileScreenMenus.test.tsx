import React from 'react';
import { TouchableOpacity, View, Text, ScrollView, Switch } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import ProfileScreen from '../src/features/user/screens/ProfileScreen';
import { useFeedbackStore } from '../src/core/feedback/feedback.store';
import { useAuthStore } from '../src/core/storage/useAuthStore';

// Mocks
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
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

jest.mock('expo-screen-capture', () => ({
  preventScreenCaptureAsync: jest.fn().mockResolvedValue(true),
  allowScreenCaptureAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('../src/core/security/useScreenGuard', () => ({
  useScreenGuard: jest.fn(),
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

jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: View,
  };
});

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: View,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 24, left: 0, right: 0 }),
}));

jest.mock('../src/core/security/biometrics.service', () => ({
  BiometricsService: {
    isAvailable: jest.fn().mockResolvedValue(false),
    authenticate: jest.fn().mockResolvedValue(false),
  },
}));

describe('TASK-FE-09: ProfileScreen Interactive Menus Unit & Navigation Tests', () => {
  let renderer: any = null;

  beforeEach(() => {
    jest.clearAllMocks();
    useFeedbackStore.setState({ dialog: null, toast: null, dialogQueue: [] });
    useAuthStore.setState({
      user: {
        id: 'usr-1',
        username: 'Budi Test',
        email: 'budi@test.com',
        phoneNumber: '08123456789',
        role: 'user',
        isVerified: true,
        isSuspended: false,
        twoFactorEnabled: false,
        avatar: null,
        nik: '3171000000000001',
        balance: 1000000,
        isEmailVerified: true,
        isKycVerified: true,
        accountTier: 'premium',
        hasPin: true,
        idCardPhoto: null,
        bio: 'Investor e-wallet',
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
  });

  it('1. Harus menavigasikan ke ChangePin saat Menu id 1 (PIN Transaksi) diketuk', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
      await Promise.resolve();
    });

    const touchables = renderer.root.findAllByType(TouchableOpacity);
    const menuPin = touchables.find((t: any) =>
      t.props.children?.some?.((c: any) => c?.props?.children?.[1]?.props?.children?.[0]?.props?.children === 'PIN Transaksi')
    );
    expect(menuPin).toBeDefined();

    ReactTestRenderer.act(() => {
      menuPin.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('ChangePin');
  });

  it('2. Harus menavigasikan ke ChangePassword saat Menu id 2 (Ubah Kata Sandi) diketuk', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
      await Promise.resolve();
    });

    const touchables = renderer.root.findAllByType(TouchableOpacity);
    const menuPassword = touchables.find((t: any) =>
      t.props.children?.some?.((c: any) => c?.props?.children?.[1]?.props?.children?.[0]?.props?.children === 'Ubah Kata Sandi')
    );
    expect(menuPassword).toBeDefined();

    ReactTestRenderer.act(() => {
      menuPassword.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('ChangePassword');
  });

  it('3. Harus menavigasikan ke ChangeEmail saat Menu id 3 (Ubah Alamat Email) diketuk', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
      await Promise.resolve();
    });

    const touchables = renderer.root.findAllByType(TouchableOpacity);
    const menuEmail = touchables.find((t: any) =>
      t.props.children?.some?.((c: any) => c?.props?.children?.[1]?.props?.children?.[0]?.props?.children === 'Ubah Alamat Email')
    );
    expect(menuEmail).toBeDefined();

    ReactTestRenderer.act(() => {
      menuEmail.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('ChangeEmail');
  });

  it('4. [TASK-FE-09 DoD] Menu id 4 (Rekening Bank) harus memicu modal dialog alert informatif, tidak silent', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
      await Promise.resolve();
    });

    const touchables = renderer.root.findAllByType(TouchableOpacity);
    const menuBank = touchables.find((t: any) =>
      t.props.children?.some?.((c: any) => c?.props?.children?.[1]?.props?.children?.[0]?.props?.children === 'Rekening Bank')
    );
    expect(menuBank).toBeDefined();

    ReactTestRenderer.act(() => {
      menuBank.props.onPress();
    });

    const dialogState = useFeedbackStore.getState().dialog;
    expect(dialogState).not.toBeNull();
    expect(dialogState?.title).toBe('Rekening Bank Penarikan');
    expect(dialogState?.message).toMatch(/Tarik Saldo/i);
  });

  it('5. [TASK-FE-09 DoD] Menu id 5 (Pusat Bantuan) harus memicu dialog bantuan konfirmasi interaktif', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
      await Promise.resolve();
    });

    const touchables = renderer.root.findAllByType(TouchableOpacity);
    const menuHelp = touchables.find((t: any) =>
      t.props.children?.some?.((c: any) => c?.props?.children?.[1]?.props?.children?.[0]?.props?.children === 'Pusat Bantuan')
    );
    expect(menuHelp).toBeDefined();

    ReactTestRenderer.act(() => {
      menuHelp.props.onPress();
    });

    const dialogState = useFeedbackStore.getState().dialog;
    expect(dialogState).not.toBeNull();
    expect(dialogState?.title).toBe('Pusat Bantuan GreenPay');
    expect(dialogState?.message).toMatch(/support@greenpay\.com/i);
  });

  it('6. [TASK-FE-09 DoD] Menu id 6 (Syarat & Ketentuan) harus memicu dialog kepatuhan & regulasi UU PDP', async () => {
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<ProfileScreen />);
      await Promise.resolve();
    });

    const touchables = renderer.root.findAllByType(TouchableOpacity);
    const menuTerms = touchables.find((t: any) =>
      t.props.children?.some?.((c: any) => c?.props?.children?.[1]?.props?.children?.[0]?.props?.children === 'Syarat & Ketentuan')
    );
    expect(menuTerms).toBeDefined();

    ReactTestRenderer.act(() => {
      menuTerms.props.onPress();
    });

    const dialogState = useFeedbackStore.getState().dialog;
    expect(dialogState).not.toBeNull();
    expect(dialogState?.title).toBe('Syarat & Ketentuan Layanan');
    expect(dialogState?.message).toMatch(/UU PDP No\. 27\/2022/i);
  });
});
