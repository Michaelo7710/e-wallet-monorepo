import { UserLocalDataSource } from '../src/data/datasources/local/user.local-datasource';
import { UserRepositoryImpl } from '../src/data/repositories/user.repository.impl';
import { UserRemoteDataSource } from '../src/data/datasources/remote/user.remote-datasource';
import { User } from '../src/domain/entities/user';
import * as sqliteCore from '../src/core/database/sqlite';
import { useAuthStore } from '../src/core/storage/useAuthStore';
import { secureStorageService } from '../src/core/security/secureStorage.service';
import { userLocalDataSource, paymentLocalDataSource } from '../src/core/di/container';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

jest.mock('../src/core/database/sqlite');
jest.mock('@core/network/api', () => ({
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    BIOMETRICS_ENABLED: 'biometrics_enabled',
  },
}));
jest.mock('../src/core/security/biometrics.service', () => ({
  BiometricsService: {
    isAvailable: jest.fn(),
    authenticate: jest.fn(),
  },
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
  id: 'usr-123',
  username: 'budi_santoso',
  email: 'budi@example.com',
  phoneNumber: '081234567890',
  role: 'user',
  isVerified: true,
  isSuspended: false,
  twoFactorEnabled: true,
  avatar: 'https://avatar.test/budi.png',
  nik: '3171012345670001',
  balance: 15000000,
  isEmailVerified: true,
  isKycVerified: true,
  accountTier: 'premium',
  hasPin: true,
};

describe('TASK-B3-02: UserLocalDataSource (SQLite SSOT)', () => {
  let localDataSource: UserLocalDataSource;
  let mockDb: any;
  let mockUserProfileTable: any[];

  beforeEach(() => {
    mockUserProfileTable = [];

    mockDb = {
      runAsync: jest.fn(async (_sql: string, ...params: any[]) => {
        const [
          id,
          username,
          email,
          phone_number,
          role,
          is_verified,
          is_suspended,
          two_factor_enabled,
          avatar,
          nik,
          balance,
          has_pin,
          updated_at,
        ] = params;

        const existingIndex = mockUserProfileTable.findIndex((u) => u.id === id);
        const row = {
          id,
          username,
          email,
          phone_number,
          role,
          is_verified,
          is_suspended,
          two_factor_enabled,
          avatar,
          nik,
          balance,
          has_pin,
          updated_at,
        };

        if (existingIndex >= 0) {
          mockUserProfileTable[existingIndex] = row;
        } else {
          mockUserProfileTable.push(row);
        }
      }),
      getFirstAsync: jest.fn(async (_sql: string) => {
        return mockUserProfileTable[0] || null;
      }),
      execAsync: jest.fn(async (sql: string) => {
        if (sql.includes('DELETE FROM user_profile')) {
          mockUserProfileTable = [];
        }
      }),
    };

    (sqliteCore.getDatabase as jest.Mock).mockResolvedValue(mockDb);
    localDataSource = new UserLocalDataSource();
  });

  it('harus menyimpan data profil pengguna dengan konversi boolean ke integer (upsertProfile)', async () => {
    await localDataSource.upsertProfile(mockUser);

    expect(mockDb.runAsync).toHaveBeenCalledTimes(1);
    expect(mockUserProfileTable).toHaveLength(1);

    const saved = mockUserProfileTable[0];
    expect(saved.id).toBe(mockUser.id);
    expect(saved.username).toBe(mockUser.username);
    expect(saved.is_verified).toBe(1);
    expect(saved.is_suspended).toBe(0);
    expect(saved.two_factor_enabled).toBe(1);
    expect(saved.balance).toBe(15000000);
    expect(saved.has_pin).toBe(1);
    expect(saved.updated_at).toBeDefined();
  });

  it('harus membaca profil dari SQLite dan memetakan kembali ke User entity (getProfile)', async () => {
    await localDataSource.upsertProfile(mockUser);

    const result = await localDataSource.getProfile();
    expect(result).not.toBeNull();
    expect(result?.id).toBe(mockUser.id);
    expect(result?.username).toBe(mockUser.username);
    expect(result?.isVerified).toBe(true);
    expect(result?.isSuspended).toBe(false);
    expect(result?.twoFactorEnabled).toBe(true);
    expect(result?.balance).toBe(15000000);
    expect(result?.nik).toBe(mockUser.nik);
    expect(result?.hasPin).toBe(true);
  });

  it('harus mengembalikan null jika tabel user_profile kosong', async () => {
    const result = await localDataSource.getProfile();
    expect(result).toBeNull();
  });

  it('harus menghapus seluruh baris di user_profile saat clearProfile dipanggil', async () => {
    await localDataSource.upsertProfile(mockUser);
    expect(mockUserProfileTable).toHaveLength(1);

    await localDataSource.clearProfile();
    expect(mockUserProfileTable).toHaveLength(0);
  });
});

describe('TASK-B3-02: UserRepositoryImpl Offline-First Integration', () => {
  let repository: UserRepositoryImpl;
  let mockRemoteDataSource: jest.Mocked<UserRemoteDataSource>;
  let mockLocalDataSource: jest.Mocked<UserLocalDataSource>;

  beforeEach(() => {
    mockRemoteDataSource = {
      getProfile: jest.fn(),
      setupPin: jest.fn(),
      updatePassword: jest.fn(),
      updateEmail: jest.fn(),
      updatePin: jest.fn(),
      updateKyc: jest.fn(),
    } as any;

    mockLocalDataSource = {
      upsertProfile: jest.fn().mockResolvedValue(undefined),
      getProfile: jest.fn().mockResolvedValue(null),
      clearProfile: jest.fn().mockResolvedValue(undefined),
    } as any;

    repository = new UserRepositoryImpl(mockRemoteDataSource, mockLocalDataSource);
  });

  it('saat ONLINE: getProfile harus mengambil dari remote dan meng-cache ke local SQLite', async () => {
    const rawRemoteData = {
      status: 'success',
      data: {
        profile: {
          _id: 'usr-123',
          username: 'budi_santoso',
          email: 'budi@example.com',
          phone_number: '081234567890',
          role: 'user' as const,
          is_verified: true,
          is_suspended: false,
          two_factor_enabled: true,
          avatar: null,
          nik: null,
          balance: 0,
        },
        wallet: {
          balance: 10000000,
          currency: 'IDR',
        },
      },
    };

    mockRemoteDataSource.getProfile.mockResolvedValueOnce(rawRemoteData);

    const result = await repository.getProfile();

    expect(mockRemoteDataSource.getProfile).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('usr-123');
    expect(result.balance).toBe(10000000);
    expect(mockLocalDataSource.upsertProfile).toHaveBeenCalledWith(result);
  });

  it('saat OFFLINE: getProfile harus fallback membaca dari SQLite lokal tanpa crash', async () => {
    mockRemoteDataSource.getProfile.mockRejectedValueOnce(new Error('Network Error: Airplane mode'));
    mockLocalDataSource.getProfile.mockResolvedValueOnce(mockUser);

    const result = await repository.getProfile();

    expect(mockRemoteDataSource.getProfile).toHaveBeenCalledTimes(1);
    expect(mockLocalDataSource.getProfile).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUser);
    expect(result.balance).toBe(15000000);
  });

  it('saat OFFLINE dan SQLite kosong: harus meneruskan network error ke UI', async () => {
    mockRemoteDataSource.getProfile.mockRejectedValueOnce(new Error('Network Error'));
    mockLocalDataSource.getProfile.mockResolvedValueOnce(null);

    await expect(repository.getProfile()).rejects.toThrow('Network Error');
  });

  it('saat updateKyc berhasil: harus memperbarui snapshot profile di SQLite lokal', async () => {
    const updatedRaw = {
      status: 'success',
      data: {
        _id: 'usr-123',
        username: 'budi_santoso',
        email: 'budi@example.com',
        phone_number: '081234567890',
        role: 'user' as const,
        is_verified: true,
        is_suspended: false,
        two_factor_enabled: true,
        avatar: null,
        nik: '3171099988880002',
        balance: 15000000,
        id_card_photo: 'data:image/jpeg;base64,mockphoto',
        bio: 'Wiraswasta transaksi harian',
      },
    };

    mockRemoteDataSource.updateKyc.mockResolvedValueOnce(updatedRaw);

    const payload = {
      nik: '3171099988880002',
      idCardPhoto: 'data:image/jpeg;base64,mockphoto',
      bio: 'Wiraswasta transaksi harian',
    };

    const result = await repository.updateKyc(payload);

    expect(mockRemoteDataSource.updateKyc).toHaveBeenCalledWith({
      nik: payload.nik,
      id_card_photo: payload.idCardPhoto,
      bio: payload.bio,
    });
    expect(mockLocalDataSource.upsertProfile).toHaveBeenCalledWith(
      expect.objectContaining({ nik: '3171099988880002' })
    );
    expect(result.nik).toBe('3171099988880002');
  });
});

describe('TASK-B3-02: useAuthStore Logout SQLite Data Hygiene', () => {
  it('harus memanggil clearProfile dan clearAll saat logoutSession dipanggil', async () => {
    await useAuthStore.getState().logoutSession();

    expect(secureStorageService.clearSession).toHaveBeenCalledTimes(1);
    expect(userLocalDataSource.clearProfile).toHaveBeenCalledTimes(1);
    expect(paymentLocalDataSource.clearAll).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
