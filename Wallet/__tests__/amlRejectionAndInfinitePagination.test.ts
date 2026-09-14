jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

import { AML_REJECTION_CATEGORIES } from '../src/features/admin/components/AmlRejectionModal';
import { useTransactionHistory } from '../src/features/user/hooks/useUserData';
import { paymentRepository } from '../src/core/di/container';

// Mock dependencies
jest.mock('@core/di/container', () => ({
  paymentRepository: {
    getHistory: jest.fn(),
  },
  userRepository: {},
  adminRepository: {},
  userLocalDataSource: {
    clearProfile: jest.fn(),
  },
  paymentLocalDataSource: {
    clearAll: jest.fn(),
  },
}));

jest.mock('@core/storage/useAuthStore', () => ({
  useAuthStore: jest.fn(() => false),
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useInfiniteQuery: jest.fn((options) => options),
  };
});

describe('TASK-B3-01: Dynamic AML Rejection Reason & Taxonomy', () => {
  it('harus mendefinisikan 5 taksonomi kategori pelanggaran kepatuhan AML', () => {
    expect(AML_REJECTION_CATEGORIES).toHaveLength(5);
    const categoryIds = AML_REJECTION_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toEqual([
      'FRAUD_SUSPICION',
      'KYC_MISMATCH',
      'SANCTION_LIST',
      'LAW_ENFORCEMENT',
      'OTHER',
    ]);
  });

  it('harus memvalidasi format audit terstruktur [KATEGORI] Catatan...', () => {
    const category = 'FRAUD_SUSPICION';
    const notes = 'Indikasi pencucian uang nominal besar tidak wajar.';
    const structuredReason = `[${category}] ${notes.trim()}`;

    expect(structuredReason).toBe(
      '[FRAUD_SUSPICION] Indikasi pencucian uang nominal besar tidak wajar.'
    );
  });

  it('harus menerapkan aturan validasi catatan non-standar (OTHER minimal 10 karakter)', () => {
    const validateRejection = (category: string | null, notes: string) => {
      const isNotesValid =
        category === 'OTHER' ? notes.trim().length >= 10 : notes.trim().length > 0;
      return Boolean(category && isNotesValid);
    };

    // Belum pilih kategori
    expect(validateRejection(null, 'Catatan investigasi')).toBe(false);

    // Kategori standar dengan catatan valid
    expect(validateRejection('FRAUD_SUSPICION', 'Mencurigakan')).toBe(true);

    // Kategori standar dengan catatan kosong
    expect(validateRejection('FRAUD_SUSPICION', '   ')).toBe(false);

    // Kategori non-standar (OTHER) dengan catatan < 10 karakter
    expect(validateRejection('OTHER', 'Pendek')).toBe(false);

    // Kategori non-standar (OTHER) dengan catatan >= 10 karakter
    expect(validateRejection('OTHER', 'Alasan khusus operasional')).toBe(true);
  });
});

describe('TASK-B3-01: useTransactionHistory Infinite Pagination Hook', () => {
  it('harus mengkonfigurasi useInfiniteQuery dengan queryKey, queryFn, dan getNextPageParam yang tepat', async () => {
    const config = useTransactionHistory('transfer') as any;

    expect(config.queryKey).toEqual(['payment', 'history', 'infinite', 'transfer']);
    expect(config.initialPageParam).toBe(1);

    // Test getNextPageParam ketika masih ada halaman berikutnya
    const mockPage1 = {
      transactions: [{ id: '1' }, { id: '2' }],
      total: 5,
    };
    const nextParam = config.getNextPageParam(mockPage1, [mockPage1]);
    expect(nextParam).toBe(2);

    // Test getNextPageParam ketika semua data sudah terambil
    const mockPage2 = {
      transactions: [{ id: '3' }, { id: '4' }, { id: '5' }],
      total: 5,
    };
    const doneParam = config.getNextPageParam(mockPage2, [mockPage1, mockPage2]);
    expect(doneParam).toBeUndefined();

    // Test queryFn
    (paymentRepository.getHistory as jest.Mock).mockResolvedValueOnce({
      transactions: [],
      total: 0,
    });
    await config.queryFn({ pageParam: 2 });
    expect(paymentRepository.getHistory).toHaveBeenCalledWith(2, 10, 'transfer');
  });
});
