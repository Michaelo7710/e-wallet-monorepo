import {
  useFeatureFlagStore,
  DEFAULT_FEATURE_FLAGS,
  isFeatureEnabled,
  getMaintenanceNotice,
} from '../src/core/config/featureFlags';
import api from '../src/core/network/api';

jest.mock('../src/core/network/api', () => ({
  get: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
}));

describe('TASK-B3-04: Feature Flags & Operational Kill-Switch Engine', () => {
  beforeEach(() => {
    useFeatureFlagStore.setState({
      flags: { ...DEFAULT_FEATURE_FLAGS },
      lastUpdated: null,
      isLoading: false,
    });
    jest.clearAllMocks();
  });

  it('harus menyediakan konfigurasi default fail-safe (semua fitur aktif)', () => {
    expect(DEFAULT_FEATURE_FLAGS.p2p_transfer.enabled).toBe(true);
    expect(DEFAULT_FEATURE_FLAGS.topup_midtrans.enabled).toBe(true);
    expect(DEFAULT_FEATURE_FLAGS.bank_withdrawal.enabled).toBe(true);
    expect(DEFAULT_FEATURE_FLAGS.kyc_submission.enabled).toBe(true);
    expect(DEFAULT_FEATURE_FLAGS.biometric_login.enabled).toBe(true);
  });

  it('harus memperbarui flags melalui action setFlags dan memperbarui lastUpdated', () => {
    useFeatureFlagStore.getState().setFlags({
      p2p_transfer: {
        enabled: false,
        maintenanceMessage: 'Partner switching sedang dalam pemeliharaan.',
      },
    });

    const flags = useFeatureFlagStore.getState().flags;
    expect(flags.p2p_transfer.enabled).toBe(false);
    expect(flags.p2p_transfer.maintenanceMessage).toBe('Partner switching sedang dalam pemeliharaan.');
    expect(flags.topup_midtrans.enabled).toBe(true); // Fitur lain tidak terpengaruh
    expect(useFeatureFlagStore.getState().lastUpdated).toBeGreaterThan(0);
  });

  it('harus memvalidasi selector isFeatureEnabled dan getMaintenanceNotice', () => {
    expect(isFeatureEnabled('p2p_transfer')).toBe(true);
    expect(getMaintenanceNotice('p2p_transfer')).toBeNull();

    useFeatureFlagStore.getState().setFlags({
      p2p_transfer: {
        enabled: false,
        maintenanceMessage: 'P2P Transfer offline untuk perawatan server.',
      },
    });

    expect(isFeatureEnabled('p2p_transfer')).toBe(false);
    expect(getMaintenanceNotice('p2p_transfer')).toBe('P2P Transfer offline untuk perawatan server.');
  });

  it('harus mengambil remote flags dan memvalidasi payload Zod', async () => {
    const mockRemoteData = {
      data: {
        p2p_transfer: { enabled: false, maintenanceMessage: 'Maintenance Nasional' },
        topup_midtrans: { enabled: true },
      },
    };

    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockRemoteData });

    await useFeatureFlagStore.getState().fetchRemoteFlags(true);

    expect(api.get).toHaveBeenCalledWith('/config/feature-flags', { timeout: 5000 });
    expect(useFeatureFlagStore.getState().flags.p2p_transfer.enabled).toBe(false);
    expect(useFeatureFlagStore.getState().flags.p2p_transfer.maintenanceMessage).toBe('Maintenance Nasional');
    expect(useFeatureFlagStore.getState().flags.topup_midtrans.enabled).toBe(true);
  });

  it('harus menerapkan rate-limiting cache (melewati kueri jika < 5 menit)', async () => {
    useFeatureFlagStore.setState({
      lastUpdated: Date.now() - 60 * 1000, // 1 menit yang lalu
    });

    await useFeatureFlagStore.getState().fetchRemoteFlags(false);

    expect(api.get).not.toHaveBeenCalled();
  });

  it('harus menangani kegagalan remote secara fail-safe tanpa melempar crash', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network Offline: 503 Service Unavailable'));

    await expect(useFeatureFlagStore.getState().fetchRemoteFlags(true)).resolves.not.toThrow();

    // Nilai default tetap aman dan tidak korup
    expect(useFeatureFlagStore.getState().flags.p2p_transfer.enabled).toBe(true);
    expect(useFeatureFlagStore.getState().isLoading).toBe(false);
  });
});
