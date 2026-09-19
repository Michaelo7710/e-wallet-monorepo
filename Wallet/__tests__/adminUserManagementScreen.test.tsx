import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import AdminUserManagementScreen from '../src/features/admin/screens/AdminUserManagementScreen';
import AdminDashboardScreen from '../src/features/admin/screens/AdminDashboardScreen';
import { AdminRepositoryImpl } from '../src/data/repositories/admin.repository.impl';
import { AdminRemoteDataSource, RawAdminUserDTO } from '../src/data/datasources/remote/admin.remote-datasource';
import { AdminUser } from '../src/domain/repositories/admin.repository.interface';
import { useFeedbackStore } from '../src/core/feedback/feedback.store';

// Navigation Mock
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
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
let mockCurrentUser: any = { username: 'SuperAdmin', role: 'admin' };
jest.mock('@core/storage/useAuthStore', () => ({
  useAuthStore: () => ({
    user: mockCurrentUser,
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

// Mock Admin Stats for Dashboard
jest.mock('../src/features/admin/hooks/useAdminData', () => ({
  useAdminStats: () => ({
    data: {
      totalUsers: 100,
      totalVolume: 50000000,
      pendingWithdrawalsCount: 2,
      pendingTopupsCount: 1,
      pendingTransfersCount: 0,
      totalLiquidity: 80000000,
    },
    refetch: jest.fn(),
    isRefetching: false,
  }),
}));

// Mock Hooks for User Management
const mockUsersList: AdminUser[] = [
  {
    id: 'user-001',
    username: 'budi_santoso',
    email: 'budi@example.com',
    phoneNumber: '08123456789',
    avatar: null,
    accountTier: 'basic',
    isVerified: true,
    isEmailVerified: true,
    isKycVerified: true,
    isSuspended: false,
    suspendReason: null,
    suspendedAt: null,
    nik: '3201123456780001',
    role: 'user',
    balance: 1500000,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-002',
    username: 'fraudster_99',
    email: 'fraud@badactor.com',
    phoneNumber: '08987654321',
    avatar: null,
    accountTier: 'premium',
    isVerified: false,
    isEmailVerified: true,
    isKycVerified: false,
    isSuspended: true,
    suspendReason: 'Terindikasi transaksi pencucian uang ilegal',
    suspendedAt: '2026-03-01T00:00:00.000Z',
    nik: null,
    role: 'user',
    balance: 500000,
    createdAt: '2026-02-01T00:00:00.000Z',
  },
];

let mockUsersData: any = {
  pages: [
    {
      items: mockUsersList,
      nextCursor: null,
      hasMore: false,
    },
  ],
};

let mockIsLoadingUsers = false;
let mockIsRefetchingUsers = false;
const mockRefetchUsers = jest.fn().mockResolvedValue({});
const mockFetchNextPage = jest.fn().mockResolvedValue({});
let mockHasNextPage = false;
let mockIsFetchingNextPage = false;

const mockMutateFreezeAsync = jest.fn().mockResolvedValue({ id: 'user-001', isSuspended: true });
const mockMutateUnfreezeAsync = jest.fn().mockResolvedValue({ id: 'user-002', isSuspended: false });

jest.mock('../src/features/admin/hooks/useAdminUsers', () => ({
  useAdminUsers: (params: any) => ({
    data: mockUsersData,
    isLoading: mockIsLoadingUsers,
    refetch: mockRefetchUsers,
    isRefetching: mockIsRefetchingUsers,
    fetchNextPage: mockFetchNextPage,
    hasNextPage: mockHasNextPage,
    isFetchingNextPage: mockIsFetchingNextPage,
    params,
  }),
  useFreezeUserMutation: () => ({
    mutateAsync: mockMutateFreezeAsync,
    isPending: false,
  }),
  useUnfreezeUserMutation: () => ({
    mutateAsync: mockMutateUnfreezeAsync,
    isPending: false,
  }),
  ADMIN_USERS_QUERY_KEY: ['admin', 'users'],
}));

describe('TASK-ADM-04: Admin User Management Screen & Anti-Fraud Circuit', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    useFeedbackStore.setState({ dialog: null, toast: null, dialogQueue: [] });
    mockUsersData = {
      pages: [
        {
          items: [...mockUsersList],
          nextCursor: null,
          hasMore: false,
        },
      ],
    };
    mockIsLoadingUsers = false;
    mockIsRefetchingUsers = false;
    mockHasNextPage = false;
    mockIsFetchingNextPage = false;
  });

  afterEach(() => {
    if (renderer) {
      ReactTestRenderer.act(() => {
        renderer?.unmount();
      });
      renderer = null;
    }
  });

  describe('Part 1: AdminRepositoryImpl User Governance Contract & Mapping', () => {
    it('harus memetakan RawAdminUserDTO snake_case ke AdminUser camelCase domain entity dengan benar', async () => {
      const mockRawDTO: RawAdminUserDTO = {
        _id: 'user-123',
        username: 'andi_wijaya',
        email: 'andi@example.com',
        phone_number: '08111222333',
        avatar: 'https://avatar.url/andi.jpg',
        account_tier: 'premium',
        is_verified: true,
        is_email_verified: true,
        is_kyc_verified: true,
        is_suspended: false,
        suspend_reason: null,
        suspended_at: null,
        nik: '3171012345670001',
        role: 'user',
        balance: 25000000,
        createdAt: '2026-01-15T08:30:00.000Z',
      };

      const mockRemoteDataSource = {
        getUsers: jest.fn().mockResolvedValue({
          status: 'success',
          data: [mockRawDTO],
          meta: { next_cursor: 'cursor-456', has_more: true, limit: 10 },
        }),
      } as unknown as AdminRemoteDataSource;

      const repository = new AdminRepositoryImpl(mockRemoteDataSource);
      const result = await repository.getUsers({ search: 'andi', tier: 'premium' });

      expect(mockRemoteDataSource.getUsers).toHaveBeenCalledWith({
        search: 'andi',
        tier: 'premium',
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: 'user-123',
        username: 'andi_wijaya',
        email: 'andi@example.com',
        phoneNumber: '08111222333',
        avatar: 'https://avatar.url/andi.jpg',
        accountTier: 'premium',
        isVerified: true,
        isEmailVerified: true,
        isKycVerified: true,
        isSuspended: false,
        suspendReason: null,
        suspendedAt: null,
        nik: '3171012345670001',
        role: 'user',
        balance: 25000000,
        createdAt: '2026-01-15T08:30:00.000Z',
      });
      expect(result.nextCursor).toBe('cursor-456');
      expect(result.hasMore).toBe(true);
    });

    it('harus mengeksekusi freezeUser dan unfreezeUser pada remote data source dan memetakan hasilnya', async () => {
      const mockFreezeDTO: RawAdminUserDTO = {
        _id: 'user-789',
        username: 'spammer_bot',
        email: 'spam@bot.net',
        phone_number: '08999999999',
        account_tier: 'basic',
        is_verified: false,
        is_email_verified: false,
        is_kyc_verified: false,
        is_suspended: true,
        suspend_reason: 'Spamming deposit',
        suspended_at: '2026-02-10T12:00:00.000Z',
        role: 'user',
        balance: 0,
        createdAt: '2026-02-01T00:00:00.000Z',
      };

      const mockRemoteDataSource = {
        freezeUser: jest.fn().mockResolvedValue({
          status: 'success',
          data: { user: mockFreezeDTO },
        }),
        unfreezeUser: jest.fn().mockResolvedValue({
          status: 'success',
          data: { user: { ...mockFreezeDTO, is_suspended: false, suspend_reason: null, suspended_at: null } },
        }),
      } as unknown as AdminRemoteDataSource;

      const repository = new AdminRepositoryImpl(mockRemoteDataSource);

      const frozenUser = await repository.freezeUser('user-789', 'Spamming deposit');
      expect(mockRemoteDataSource.freezeUser).toHaveBeenCalledWith('user-789', 'Spamming deposit');
      expect(frozenUser.isSuspended).toBe(true);
      expect(frozenUser.suspendReason).toBe('Spamming deposit');

      const unfrozenUser = await repository.unfreezeUser('user-789');
      expect(mockRemoteDataSource.unfreezeUser).toHaveBeenCalledWith('user-789');
      expect(unfrozenUser.isSuspended).toBe(false);
      expect(unfrozenUser.suspendReason).toBeNull();
    });
  });

  describe('Part 2: Admin Dashboard Action Card Integration', () => {
    it('harus menampilkan kartu aksi Manajemen Pengguna (action-users) dan menavigasikan ke AdminUserManagement', () => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminDashboardScreen />);
      });

      const actionUsersBtn = renderer!.root.findByProps({ testID: 'action-users' });
      expect(actionUsersBtn).toBeDefined();

      ReactTestRenderer.act(() => {
        actionUsersBtn.props.onPress();
      });

      expect(mockNavigate).toHaveBeenCalledWith('AdminUserManagement');
    });
  });

  describe('Part 3: AdminUserManagementScreen Visuals & Filter Controls', () => {
    it('harus merender tombol kembali dan menavigasi goBack saat ditekan', () => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminUserManagementScreen />);
      });

      const backBtn = renderer!.root.findByProps({ testID: 'btn-back' });
      expect(backBtn).toBeDefined();

      ReactTestRenderer.act(() => {
        backBtn.props.onPress();
      });

      expect(mockGoBack).toHaveBeenCalledTimes(1);
    });

    it('harus menangani perubahan input pencarian dan tombol pembersih pencarian', () => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminUserManagementScreen />);
      });

      const searchInput = renderer!.root.findByProps({ testID: 'input-search-user' });
      expect(searchInput).toBeDefined();

      // Input teks pencarian
      ReactTestRenderer.act(() => {
        searchInput.props.onChangeText('budi');
      });

      // Tombol bersihkan pencarian muncul
      const clearBtn = renderer!.root.findByProps({ testID: 'btn-clear-search' });
      expect(clearBtn).toBeDefined();

      // Klik tombol bersihkan
      ReactTestRenderer.act(() => {
        clearBtn.props.onPress();
      });

      // Tombol bersihkan harus hilang
      const clearBtnAfter = renderer!.root.findAllByProps({ testID: 'btn-clear-search' });
      expect(clearBtnAfter).toHaveLength(0);
    });

    it('harus memungkinkan seleksi filter tingkat akun (tier) dan status akun', () => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminUserManagementScreen />);
      });

      // Filter tier pills
      ReactTestRenderer.act(() => {
        renderer!.root.findByProps({ testID: 'filter-tier-basic' }).props.onPress();
      });

      ReactTestRenderer.act(() => {
        renderer!.root.findByProps({ testID: 'filter-tier-premium' }).props.onPress();
      });

      ReactTestRenderer.act(() => {
        renderer!.root.findByProps({ testID: 'filter-tier-all' }).props.onPress();
      });

      // Filter status pills
      ReactTestRenderer.act(() => {
        renderer!.root.findByProps({ testID: 'filter-status-active' }).props.onPress();
      });

      ReactTestRenderer.act(() => {
        renderer!.root.findByProps({ testID: 'filter-status-suspended' }).props.onPress();
      });

      ReactTestRenderer.act(() => {
        renderer!.root.findByProps({ testID: 'filter-status-all' }).props.onPress();
      });
    });
  });

  describe('Part 4: User Card Rendering & Governance Badges', () => {
    it('harus merender detail kartu pengguna aktif dengan badge AKTIF dan tombol Bekukan Akun', () => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminUserManagementScreen />);
      });

      // Kartu User 1 (Aktif)
      const userCard1 = renderer!.root.findByProps({ testID: 'user-card-user-001' });
      expect(userCard1).toBeDefined();

      const email1 = renderer!.root.findByProps({ testID: 'user-email-user-001' });
      expect(email1.props.children).toBe('budi@example.com');

      const phone1 = renderer!.root.findByProps({ testID: 'user-phone-user-001' });
      expect(phone1.props.children).toBe('08123456789');

      const activeBadge = renderer!.root.findByProps({ testID: 'badge-active-user-001' });
      expect(activeBadge).toBeDefined();

      const freezeBtn = renderer!.root.findByProps({ testID: 'btn-freeze-user-001' });
      expect(freezeBtn).toBeDefined();
    });

    it('harus merender kartu pengguna dibekukan dengan badge DIBEKUKAN, alasan, dan tombol Buka Blokir', () => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminUserManagementScreen />);
      });

      // Kartu User 2 (Suspended)
      const userCard2 = renderer!.root.findByProps({ testID: 'user-card-user-002' });
      expect(userCard2).toBeDefined();

      const suspendedBadge = renderer!.root.findByProps({ testID: 'badge-suspended-user-002' });
      expect(suspendedBadge).toBeDefined();

      const unfreezeBtn = renderer!.root.findByProps({ testID: 'btn-unfreeze-user-002' });
      expect(unfreezeBtn).toBeDefined();
    });
  });

  describe('Part 5: Anti-Fraud Freeze & Unfreeze Execution Circuit', () => {
    it('harus membuka dialog konfirmasi saat tombol Bekukan Akun ditekan dan mengeksekusi freezeUser', async () => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminUserManagementScreen />);
      });

      const freezeBtn = renderer!.root.findByProps({ testID: 'btn-freeze-user-001' });

      // Tekan tombol Bekukan Akun
      ReactTestRenderer.act(() => {
        freezeBtn.props.onPress();
      });

      // Validasi dialog konfirmasi terbuka
      const dialog = useFeedbackStore.getState().dialog;
      expect(dialog).not.toBeNull();
      expect(dialog?.title).toBe('Bekukan Akun Pengguna');
      expect(dialog?.confirmText).toBe('Bekukan Akun');
      expect(dialog?.type).toBe('error'); // isDestructive

      // Eksekusi onConfirm
      await ReactTestRenderer.act(async () => {
        await dialog?.onConfirm?.();
      });

      expect(mockMutateFreezeAsync).toHaveBeenCalledWith({
        id: 'user-001',
        reason: 'Ditangguhkan oleh Administrator',
      });

      // Validasi toast sukses
      const toast = useFeedbackStore.getState().toast;
      expect(toast).not.toBeNull();
      expect(toast?.type).toBe('success');
      expect(toast?.message).toContain('budi_santoso');
    });

    it('harus membuka dialog konfirmasi saat tombol Buka Blokir ditekan dan mengeksekusi unfreezeUser', async () => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminUserManagementScreen />);
      });

      const unfreezeBtn = renderer!.root.findByProps({ testID: 'btn-unfreeze-user-002' });

      // Tekan tombol Buka Blokir
      ReactTestRenderer.act(() => {
        unfreezeBtn.props.onPress();
      });

      // Validasi dialog konfirmasi terbuka
      const dialog = useFeedbackStore.getState().dialog;
      expect(dialog).not.toBeNull();
      expect(dialog?.title).toBe('Buka Blokir Pengguna');
      expect(dialog?.confirmText).toBe('Buka Blokir');

      // Eksekusi onConfirm
      await ReactTestRenderer.act(async () => {
        await dialog?.onConfirm?.();
      });

      expect(mockMutateUnfreezeAsync).toHaveBeenCalledWith('user-002');

      // Validasi toast sukses
      const toast = useFeedbackStore.getState().toast;
      expect(toast).not.toBeNull();
      expect(toast?.type).toBe('success');
      expect(toast?.message).toContain('fraudster_99');
    });
  });

  describe('Part 6: Empty State and Loading Indicator', () => {
    it('harus merender empty-state saat data pengguna kosong dan tidak sedang loading', () => {
      mockUsersData = {
        pages: [
          {
            items: [],
            nextCursor: null,
            hasMore: false,
          },
        ],
      };
      mockIsLoadingUsers = false;

      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminUserManagementScreen />);
      });

      const emptyState = renderer!.root.findByProps({ testID: 'empty-state' });
      expect(emptyState).toBeDefined();
    });

    it('harus merender loading indicator saat initial loading', () => {
      mockUsersData = {
        pages: [
          {
            items: [],
            nextCursor: null,
            hasMore: false,
          },
        ],
      };
      mockIsLoadingUsers = true;

      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<AdminUserManagementScreen />);
      });

      const loader = renderer!.root.findByProps({ testID: 'loading-indicator' });
      expect(loader).toBeDefined();
    });
  });
});
