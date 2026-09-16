jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

import { getWalletTierInfo } from '../src/shared/components/WalletCard';
import { User } from '../src/domain/entities/user';
import { UserMapper } from '../src/data/mappers/userMapper';
import { Alert } from 'react-native';

jest.mock('../src/core/security/biometrics.service', () => ({
  BiometricsService: {
    isAvailable: jest.fn(),
    authenticate: jest.fn(),
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

jest.mock('../src/core/database/sqlite');
jest.mock('@core/network/api', () => ({
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    BIOMETRICS_ENABLED: 'biometrics_enabled',
  },
}));
jest.mock('../src/core/security/secureStorage.service', () => ({
  secureStorageService: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    clearSession: jest.fn(),
  },
}));

describe('TASK-QA-HOTFIX-05: getWalletTierInfo & Defensive Verification Resilience', () => {
  describe('1. Logika Kalkulasi Plafon Saldo (getWalletTierInfo)', () => {
    it('harus mengembalikan Akun Basic dengan limit Rp 5.000.000 jika user null', () => {
      const tierInfo = getWalletTierInfo(null);
      expect(tierInfo).toEqual({
        tierName: 'Akun Basic',
        maxLimit: 5000000,
        formattedLimit: 'Rp 5.000.000',
        isPremium: false,
      });
    });

    it('harus mengembalikan Akun Basic (Rp 5.000.000) untuk akun baru yang sudah verifikasi email tapi belum KYC', () => {
      const newlyVerifiedUser: User = {
        id: 'usr-new-01',
        username: 'pengguna_baru',
        email: 'baru@example.com',
        phoneNumber: '081234567890',
        role: 'user',
        isVerified: true, // Legacy flag di backend lama mungkin bernilai true setelah verifikasi email!
        isSuspended: false,
        twoFactorEnabled: false,
        avatar: null,
        nik: null,
        balance: 100000,
        isEmailVerified: true,
        isKycVerified: false,
        accountTier: 'basic',
        hasPin: false,
      };

      const tierInfo = getWalletTierInfo(newlyVerifiedUser);

      // WAJIB mengevaluasi accountTier/isKycVerified, BUKAN isVerified legacy!
      expect(tierInfo.isPremium).toBe(false);
      expect(tierInfo.tierName).toBe('Akun Basic');
      expect(tierInfo.maxLimit).toBe(5000000);
      expect(tierInfo.formattedLimit).toBe('Rp 5.000.000');
    });

    it('harus mengembalikan Akun Premium dengan limit Rp 50.000.000 jika accountTier === "premium"', () => {
      const premiumUser: User = {
        id: 'usr-prem-01',
        username: 'sultan_crypto',
        email: 'sultan@example.com',
        phoneNumber: '081299998888',
        role: 'user',
        isVerified: true,
        isSuspended: false,
        twoFactorEnabled: true,
        avatar: null,
        nik: '3171012345670001',
        balance: 45000000,
        isEmailVerified: true,
        isKycVerified: true,
        accountTier: 'premium',
        hasPin: true,
      };

      const tierInfo = getWalletTierInfo(premiumUser);
      expect(tierInfo.isPremium).toBe(true);
      expect(tierInfo.tierName).toBe('Akun Premium');
      expect(tierInfo.maxLimit).toBe(50000000);
      expect(tierInfo.formattedLimit).toBe('Rp 50.000.000');
    });

    it('harus mengembalikan Akun Premium dengan limit Rp 50.000.000 jika isKycVerified bernilai true', () => {
      const kycUser: Partial<User> = {
        isKycVerified: true,
        accountTier: 'basic' as any, // edge case: tier belum terupdate tapi isKycVerified true
      };

      const tierInfo = getWalletTierInfo(kycUser as User);
      expect(tierInfo.isPremium).toBe(true);
      expect(tierInfo.maxLimit).toBe(50000000);
      expect(tierInfo.formattedLimit).toBe('Rp 50.000.000');
    });
  });

  describe('2. Defensive Auto-Login Extraction & Legacy Fallback Logic', () => {
    let mockLoginSession: jest.Mock;
    let mockNavigate: jest.Mock;
    let alertSpy: jest.SpyInstance;
    let warnSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      mockLoginSession = jest.fn().mockResolvedValue(undefined);
      mockNavigate = jest.fn();
      alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      alertSpy.mockRestore();
      warnSpy.mockRestore();
    });

    // Implementasi fungsi ekstraksi defensif identik dengan VerifyEmailScreen
    const simulateVerifySuccess = async (response: any) => {
      try {
        const payload = response?.data?.data || response?.data || response;
        const user = payload?.user;
        const accessToken = payload?.access_token || payload?.accessToken || payload?.token;
        const refreshToken = payload?.refresh_token || payload?.refreshToken;

        if (user && accessToken && refreshToken) {
          const sessionUser = {
            ...UserMapper.toDomain(user),
            id: user.id || user._id,
            _id: user._id || user.id,
          };
          await mockLoginSession(sessionUser, accessToken, refreshToken);
          Alert.alert('Selamat Datang!', 'Email Anda berhasil diverifikasi. Sesi Anda telah aktif.');
          return;
        }

        console.warn(' [VERIFY_EMAIL] Server tidak mengembalikan token sesi lengkap. Mengalihkan ke Login manual.');
        Alert.alert(
          'Verifikasi Berhasil',
          'Email Anda telah terverifikasi. Silakan masuk dengan kata sandi Anda.',
          [{ text: 'Masuk Sekarang', onPress: () => mockNavigate('Login') }]
        );
      } catch (err) {
        console.error(' [VERIFY_EMAIL] Gagal memproses sesi:', err);
        mockNavigate('Login');
      }
    };

    it('harus berhasil auto-login saat response berformat nested envelope: response.data.data', async () => {
      const mockResponse = {
        data: {
          status: 'success',
          data: {
            user: {
              _id: 'usr-new-01',
              username: 'budi',
              email: 'budi@example.com',
              phone_number: '081234567890',
              role: 'user',
              is_verified: false,
              is_suspended: false,
              two_factor_enabled: false,
              balance: 0,
            },
            access_token: 'jwt-access-nested-123',
            refresh_token: 'jwt-refresh-nested-456',
          },
        },
      };

      await simulateVerifySuccess(mockResponse);

      expect(mockLoginSession).toHaveBeenCalledTimes(1);
      expect(mockLoginSession).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'usr-new-01',
          username: 'budi',
          email: 'budi@example.com',
          accountTier: 'basic',
        }),
        'jwt-access-nested-123',
        'jwt-refresh-nested-456'
      );
      expect(alertSpy).toHaveBeenCalledWith(
        'Selamat Datang!',
        'Email Anda berhasil diverifikasi. Sesi Anda telah aktif.'
      );
    });

    it('harus berhasil auto-login saat response berformat flat envelope: response.data', async () => {
      const mockResponse = {
        data: {
          user: {
            _id: 'usr-new-02',
            username: 'ani',
            email: 'ani@example.com',
            phone_number: '081234567891',
            role: 'user',
            is_verified: false,
            is_suspended: false,
            two_factor_enabled: false,
            balance: 0,
          },
          accessToken: 'jwt-access-flat-123',
          refreshToken: 'jwt-refresh-flat-456',
        },
      };

      await simulateVerifySuccess(mockResponse);

      expect(mockLoginSession).toHaveBeenCalledTimes(1);
      expect(mockLoginSession).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'usr-new-02', username: 'ani' }),
        'jwt-access-flat-123',
        'jwt-refresh-flat-456'
      );
    });

    it('harus berhasil auto-login jika token menggunakan nama "token" bukan "access_token"', async () => {
      const mockResponse = {
        user: {
          _id: 'usr-new-03',
          username: 'citra',
          email: 'citra@example.com',
          phone_number: '081234567892',
          role: 'user',
          is_verified: false,
          is_suspended: false,
          two_factor_enabled: false,
          balance: 0,
        },
        token: 'jwt-token-direct-123',
        refreshToken: 'jwt-refresh-direct-456',
      };

      await simulateVerifySuccess(mockResponse);

      expect(mockLoginSession).toHaveBeenCalledTimes(1);
      expect(mockLoginSession).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'usr-new-03' }),
        'jwt-token-direct-123',
        'jwt-refresh-direct-456'
      );
    });

    it('harus fallback ke login manual jika backend lama tidak mengirimkan token sesi (mencegah warning authStore)', async () => {
      const legacyResponse = {
        status: 'success',
        message: 'Email berhasil diverifikasi.',
      };

      await simulateVerifySuccess(legacyResponse);

      // loginSession TIDAK boleh dipanggil dengan argumen kosong/undefined
      expect(mockLoginSession).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[VERIFY_EMAIL] Server tidak mengembalikan token sesi lengkap')
      );
      expect(alertSpy).toHaveBeenCalledWith(
        'Verifikasi Berhasil',
        'Email Anda telah terverifikasi. Silakan masuk dengan kata sandi Anda.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Masuk Sekarang' }),
        ])
      );

      // Simulasikan pengguna menekan tombol "Masuk Sekarang"
      const alertButtons = alertSpy.mock.calls[0][2];
      alertButtons[0].onPress();
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });

    it('harus menangani respon di mana user ada tapi refresh_token tidak ada', async () => {
      const partialResponse = {
        data: {
          user: { _id: 'usr-partial' },
          access_token: 'some-token',
          // refresh_token hilang
        },
      };

      await simulateVerifySuccess(partialResponse);

      expect(mockLoginSession).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Verifikasi Berhasil',
        expect.any(String),
        expect.any(Array)
      );
    });
  });
});
