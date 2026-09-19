import React from 'react';
import { RefreshControl, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import AdminDashboardScreen from '../src/features/admin/screens/AdminDashboardScreen';
import { AdminRepositoryImpl } from '../src/data/repositories/admin.repository.impl';
import { AdminRemoteDataSource } from '../src/data/datasources/remote/admin.remote-datasource';
import { useFeedbackStore } from '../src/core/feedback/feedback.store';
import { queryClient } from '../src/core/network/queryClient';

// Navigation Mock
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
}));

// Shared Layout Mock
jest.mock('@shared/layouts', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    UserLayout: ({ children }: any) => <View testID="user-layout">{children}</View>,
  };
});

// NetInfo Mock
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);

// Expo Vector Icons Mock
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Auth Store Mock
const mockLogoutSession = jest.fn();
let mockUser: any = { username: 'SuperAdmin', role: 'admin' };

jest.mock('@core/storage/useAuthStore', () => ({
  useAuthStore: () => ({
    user: mockUser,
    logoutSession: mockLogoutSession,
  }),
}));

// Query Client Mock
jest.mock('@core/network/queryClient', () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
    clear: jest.fn(),
  },
}));

// Admin Hook Mock
let mockStatsData: any = {
  totalUsers: 250,
  totalVolume: 120000000,
  pendingWithdrawalsCount: 7,
  pendingTopupsCount: 4,
  pendingTransfersCount: 2,
  totalLiquidity: 300000000,
};
const mockRefetch = jest.fn().mockResolvedValue({});
let mockIsRefetching = false;

jest.mock('../src/features/admin/hooks/useAdminData', () => ({
  useAdminStats: () => ({
    data: mockStatsData,
    refetch: mockRefetch,
    isRefetching: mockIsRefetching,
  }),
}));

describe('TASK-ADM-02: Admin Dashboard Live Stats, Counter Badges & Pull-to-Refresh', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    useFeedbackStore.setState({ dialog: null, toast: null, dialogQueue: [] });
    mockStatsData = {
      totalUsers: 250,
      totalVolume: 120000000,
      pendingWithdrawalsCount: 7,
      pendingTopupsCount: 4,
      pendingTransfersCount: 2,
      totalLiquidity: 300000000,
    };
    mockIsRefetching = false;
  });

  afterEach(() => {
    if (renderer) {
      ReactTestRenderer.act(() => {
        renderer?.unmount();
      });
      renderer = null;
    }
  });

  describe('Part 1: AdminRepositoryImpl getStats() Contract & Mapping', () => {
    it('harus memetakan respons remote snake_case ke domain entity camelCase dengan tepat', async () => {
      const mockRemoteDataSource = {
        getStats: jest.fn().mockResolvedValue({
          success: true,
          data: {
            total_users: 500,
            total_volume: 75000000,
            pending_withdrawals_count: 12,
            pending_topups_count: 8,
            pending_transfers_count: 3,
            total_liquidity: 150000000,
          },
        }),
      } as unknown as AdminRemoteDataSource;

      const repository = new AdminRepositoryImpl(mockRemoteDataSource);
      const stats = await repository.getStats();

      expect(mockRemoteDataSource.getStats).toHaveBeenCalledTimes(1);
      expect(stats).toEqual({
        totalUsers: 500,
        totalVolume: 75000000,
        pendingWithdrawalsCount: 12,
        pendingTopupsCount: 8,
        pendingTransfersCount: 3,
        totalLiquidity: 150000000,
      });
    });

    it('harus menangani nilai kosong/undefined/null dengan fallback 0 yang aman', async () => {
      const mockRemoteDataSource = {
        getStats: jest.fn().mockResolvedValue({
          success: true,
          data: {},
        }),
      } as unknown as AdminRemoteDataSource;

      const repository = new AdminRepositoryImpl(mockRemoteDataSource);
      const stats = await repository.getStats();

      expect(stats).toEqual({
        totalUsers: 0,
        totalVolume: 0,
        pendingWithdrawalsCount: 0,
        pendingTopupsCount: 0,
        pendingTransfersCount: 0,
        totalLiquidity: 0,
      });
    });
  });

  describe('Part 2: Executive Summary Cards Rendering', () => {
    it('harus merender 4 kartu metrik utama dengan kalkulasi antrean agregat dan format IDR', () => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminDashboardScreen />);
      });

      // 1. Total Pengguna
      const usersEl = renderer!.root.findByProps({ testID: 'stat-total-users' });
      expect(usersEl.props.children).toBe(250);

      // 2. Antrean Pending (7 + 4 + 2 = 13)
      const queueEl = renderer!.root.findByProps({ testID: 'stat-pending-queue' });
      expect(queueEl.props.children).toBe(13);

      // 3. Total Volume Transaksi (Rp 120.000.000)
      const volumeEl = renderer!.root.findByProps({ testID: 'stat-total-volume' });
      const volumeText = Array.isArray(volumeEl.props.children)
        ? volumeEl.props.children.join('')
        : String(volumeEl.props.children);
      expect(volumeText).toContain('120.000.000');

      // 4. Likuiditas Dompet Beredar (Rp 300.000.000)
      const liquidityEl = renderer!.root.findByProps({ testID: 'stat-total-liquidity' });
      const liquidityText = Array.isArray(liquidityEl.props.children)
        ? liquidityEl.props.children.join('')
        : String(liquidityEl.props.children);
      expect(liquidityText).toContain('300.000.000');
    });

    it('harus merender nilai default 0 jika stats bernilai undefined/null', () => {
      mockStatsData = null;

      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminDashboardScreen />);
      });

      const usersEl = renderer!.root.findByProps({ testID: 'stat-total-users' });
      expect(usersEl.props.children).toBe(0);

      const queueEl = renderer!.root.findByProps({ testID: 'stat-pending-queue' });
      expect(queueEl.props.children).toBe(0);

      const volumeEl = renderer!.root.findByProps({ testID: 'stat-total-volume' });
      const volumeText = Array.isArray(volumeEl.props.children)
        ? volumeEl.props.children.join('')
        : String(volumeEl.props.children);
      expect(volumeText).toContain('Rp 0');

      const liquidityEl = renderer!.root.findByProps({ testID: 'stat-total-liquidity' });
      const liquidityText = Array.isArray(liquidityEl.props.children)
        ? liquidityEl.props.children.join('')
        : String(liquidityEl.props.children);
      expect(liquidityText).toContain('Rp 0');
    });
  });

  describe('Part 3: Floating Counter Badges Conditional Rendering', () => {
    it('harus menampilkan counter badge merah saat antrean pending bernilai > 0', () => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminDashboardScreen />);
      });

      // Penarikan Badge (7)
      const withdrawalBadge = renderer!.root.findByProps({ testID: 'badge-pending-withdrawals' });
      expect(withdrawalBadge).toBeDefined();
      const withdrawalText = withdrawalBadge.findByType(Text);
      expect(withdrawalText.props.children).toBe(7);

      // Top Up Badge (4)
      const topupBadge = renderer!.root.findByProps({ testID: 'badge-pending-topups' });
      expect(topupBadge).toBeDefined();
      const topupText = topupBadge.findByType(Text);
      expect(topupText.props.children).toBe(4);

      // Transfer Badge (2)
      const transferBadge = renderer!.root.findByProps({ testID: 'badge-pending-transfers' });
      expect(transferBadge).toBeDefined();
      const transferText = transferBadge.findByType(Text);
      expect(transferText.props.children).toBe(2);
    });

    it('TIDAK boleh merender counter badge saat antrean pending bernilai 0', () => {
      mockStatsData = {
        totalUsers: 100,
        totalVolume: 5000000,
        pendingWithdrawalsCount: 0,
        pendingTopupsCount: 0,
        pendingTransfersCount: 0,
        totalLiquidity: 10000000,
      };

      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminDashboardScreen />);
      });

      // Badges should not exist in the rendered tree
      const withdrawalBadges = renderer!.root.findAllByProps({ testID: 'badge-pending-withdrawals' });
      expect(withdrawalBadges).toHaveLength(0);

      const topupBadges = renderer!.root.findAllByProps({ testID: 'badge-pending-topups' });
      expect(topupBadges).toHaveLength(0);

      const transferBadges = renderer!.root.findAllByProps({ testID: 'badge-pending-transfers' });
      expect(transferBadges).toHaveLength(0);

      const queueEl = renderer!.root.findByProps({ testID: 'stat-pending-queue' });
      expect(queueEl.props.children).toBe(0);
    });
  });

  describe('Part 4: Pull-to-Refresh & Cache Invalidation', () => {
    it('harus memicu refetch() dan invalidateQueries([admin]) saat onRefresh dipanggil', async () => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminDashboardScreen />);
      });

      const refreshControl = renderer!.root.findByType(RefreshControl);
      expect(refreshControl).toBeDefined();

      await ReactTestRenderer.act(async () => {
        refreshControl.props.onRefresh();
      });

      expect(mockRefetch).toHaveBeenCalledTimes(1);
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['admin'] });
    });
  });

  describe('Part 5: Action Card Navigation & Logout Flow', () => {
    it('harus menavigasikan ke layar yang tepat saat kartu aksi diklik', () => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminDashboardScreen />);
      });

      // 1. Test Persetujuan Penarikan
      const penarikanBtn = renderer!.root.findByProps({ testID: 'action-withdrawals' });
      penarikanBtn.props.onPress();
      expect(mockNavigate).toHaveBeenCalledWith('AdminApprovals');

      // 2. Test Persetujuan Top Up Manual
      const topupBtn = renderer!.root.findByProps({ testID: 'action-topups' });
      topupBtn.props.onPress();
      expect(mockNavigate).toHaveBeenCalledWith('AdminTopUpApprovals');

      // 3. Test Kliring Transfer AML
      const transferBtn = renderer!.root.findByProps({ testID: 'action-transfers' });
      transferBtn.props.onPress();
      expect(mockNavigate).toHaveBeenCalledWith('AdminTransferApprovals');

      // 4. Test Rekening Bank Master
      const bankBtn = renderer!.root.findByProps({ testID: 'action-banks' });
      bankBtn.props.onPress();
      expect(mockNavigate).toHaveBeenCalledWith('AdminBankManagement');

      // 5. Test Laporan Neraca Keuangan
      const financeBtn = renderer!.root.findByProps({ testID: 'action-financial-report' });
      financeBtn.props.onPress();
      expect(mockNavigate).toHaveBeenCalledWith('AdminFinancialReport');

      // 6. Test Card Volume & Liquidity
      const volumeCard = renderer!.root.findByProps({ testID: 'action-card-volume' });
      volumeCard.props.onPress();
      expect(mockNavigate).toHaveBeenCalledWith('AdminFinancialReport');

      const liquidityCard = renderer!.root.findByProps({ testID: 'action-card-liquidity' });
      liquidityCard.props.onPress();
      expect(mockNavigate).toHaveBeenCalledWith('AdminFinancialReport');
    });

    it('harus menampilkan modal konfirmasi logout dan mengeksekusi logout saat dikonfirmasi', async () => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminDashboardScreen />);
      });

      const logoutBtn = renderer!.root.findByProps({ testID: 'btn-logout' });
      expect(logoutBtn).toBeDefined();

      // Tap logout
      ReactTestRenderer.act(() => {
        logoutBtn.props.onPress();
      });

      // Verify dialog is queued
      const dialog = useFeedbackStore.getState().dialog;
      expect(dialog).not.toBeNull();
      expect(dialog?.title).toBe('Keluar Panel Admin');
      expect(dialog?.confirmText).toBe('Keluar');

      // Execute onConfirm
      await ReactTestRenderer.act(async () => {
        await dialog?.onConfirm?.();
      });

      expect(mockLogoutSession).toHaveBeenCalledTimes(1);
      expect(queryClient.clear).toHaveBeenCalledTimes(1);
    });
  });
});
