import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useVerify2FAMutation } from '../src/features/auth/hooks/useAuthMutations';
import { useAuthStore } from '../src/core/storage/useAuthStore';
import { authRepository, userLocalDataSource } from '../src/core/di/container';
import { queryClient as appQueryClient } from '../src/core/network/queryClient';
import { QUERY_KEYS } from '../src/core/network/queryKeys';
import { User } from '../src/domain/entities/user';

// Mock Expo virtual env
jest.mock('expo/virtual/env', () => ({
  env: process.env,
}));

// Mock DI Container
jest.mock('../src/core/di/container', () => ({
  authRepository: {
    verify2FA: jest.fn(),
  },
  userLocalDataSource: {
    upsertProfile: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);

// Mock Storage & Secure Storage
jest.mock('../src/core/security/secureStorage.service', () => ({
  secureStorageService: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    clearSession: jest.fn(),
  },
}));

jest.mock('../src/core/security/biometrics.service', () => ({
  BiometricsService: {
    isAvailable: jest.fn(),
    authenticate: jest.fn(),
  },
}));

const mockUser: User = {
  id: 'usr-2fa-hook-01',
  username: 'andi_hook',
  email: 'andi.hook@example.com',
  phoneNumber: '081999888777',
  role: 'user',
  isVerified: true,
  isSuspended: false,
  twoFactorEnabled: false,
  avatar: null,
  nik: '3201123456780009',
  balance: 10000000,
  isEmailVerified: true,
  isKycVerified: true,
  accountTier: 'premium',
  hasPin: true,
};

describe('TASK-FE-20: Hook-Layer 2FA State Mutation & SQLite SSOT Sync', () => {
  let queryClient: QueryClient;
  let renderer: any = null;

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: { ...mockUser, twoFactorEnabled: false },
      token: 'token-test',
      isAuthenticated: true,
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
      act(() => {
        renderer.unmount();
      });
      renderer = null;
    }
    queryClient.clear();
  });

  it('1. [DoD] useVerify2FAMutation secara otomatis mengupdate state store (setUser) dan persistensi lokal (upsertProfile) pada level hook onSuccess', async () => {
    (authRepository.verify2FA as jest.Mock).mockResolvedValueOnce({
      status: 'success',
      message: '2FA verified',
    });

    const invalidateSpy = jest.spyOn(appQueryClient, 'invalidateQueries');

    let hookResult: any;
    const TestComponent = () => {
      hookResult = useVerify2FAMutation();
      return null;
    };

    act(() => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <TestComponent />
        </QueryClientProvider>
      );
    });

    // Verifikasi initial state
    expect(useAuthStore.getState().user?.twoFactorEnabled).toBe(false);

    // Trigger mutasi verifikasi 2FA dari hook
    await act(async () => {
      await hookResult.mutateAsync({ token: '123456' });
      await Promise.resolve();
    });

    // 1. Verifikasi authRepository.verify2FA terpanggil
    expect(authRepository.verify2FA).toHaveBeenCalledWith('123456');

    // 2. [DoD Verification] Verifikasi store state user.twoFactorEnabled otomatis berubah menjadi true di hook level
    const currentUser = useAuthStore.getState().user;
    expect(currentUser).not.toBeNull();
    expect(currentUser?.twoFactorEnabled).toBe(true);

    // 3. [DoD Verification] Verifikasi userLocalDataSource.upsertProfile otomatis dipanggil dengan payload yang tersinkronisasi
    expect(userLocalDataSource.upsertProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockUser.id,
        twoFactorEnabled: true,
      })
    );

    // 4. [DoD Verification] Verifikasi queryClient.invalidateQueries dipanggil untuk user profile query key
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: QUERY_KEYS.USER.PROFILE,
    });

    invalidateSpy.mockRestore();
  });
});
