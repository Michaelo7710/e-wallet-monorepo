import React from 'react';
import { Share, TouchableOpacity, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import * as Clipboard from 'expo-clipboard';

import TransactionDetailScreen from '../src/features/payment/screens/TransactionDetailScreen';
import { useFeedbackStore } from '../src/core/feedback/feedback.store';

// Mocks
const mockNavigate = jest.fn();
let mockRouteParams: any = {
  params: {
    transaction: {
      id: 'tx-999',
      referenceId: 'GP-REF-998877',
      amount: 75000,
      type: 'p2p_transfer',
      status: 'completed',
      description: 'Transfer ke teman',
      createdAt: '2026-09-17T08:30:00.000Z',
      counterparty: {
        username: 'Budi Santoso',
        phoneNumber: '081299990000',
      },
    },
  },
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
  useRoute: () => mockRouteParams,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return {
    LinearGradient: View,
  };
});

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 24, left: 0, right: 0 }),
}));

describe('TASK-QA-01: TransactionDetailScreen (Screen #26) Integration & UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFeedbackStore.setState({ dialog: null, toast: null });
  });

  it('harus merender status "Transaksi Berhasil" pada alur transaksi sukses', () => {
    mockRouteParams = {
      params: {
        transaction: {
          id: 'tx-001',
          referenceId: 'GP-REF-SUCCESS-01',
          amount: 50000,
          status: 'completed',
          type: 'transfer',
          counterparty: {
            username: 'Siti Aminah',
          },
        },
      },
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
    });

    const root = renderer!.root;
    const allText = root.findAllByType(Text).map((t) => t.props.children).flat().join(' ');

    expect(allText).toContain('Transaksi Berhasil');
    expect(allText).toContain('Siti Aminah');
    expect(allText).toContain('GP-REF-SUCCESS-01');
  });

  it('harus merender status "Menunggu Persetujuan (AML)" untuk transaksi bernilai tinggi (>= 10jt) atau status pending_approval', () => {
    mockRouteParams = {
      params: {
        transaction: {
          id: 'tx-aml-01',
          referenceId: 'GP-REF-AML-01',
          amount: 15000000,
          status: 'pending_approval',
          isHighValue: true,
          counterparty: {
            username: 'PT Mega Korporasi',
          },
        },
      },
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
    });

    const root = renderer!.root;
    const allText = root.findAllByType(Text).map((t) => t.props.children).flat().join(' ');

    expect(allText).toContain('Menunggu Persetujuan (AML)');
    expect(allText).toContain('PT Mega Korporasi');
  });

  it('harus merender status "Transaksi Gagal" ketika status bernilai failed atau rejected', () => {
    mockRouteParams = {
      params: {
        transaction: {
          id: 'tx-fail-01',
          referenceId: 'GP-REF-FAIL-01',
          amount: 100000,
          status: 'failed',
          counterparty: {
            username: 'Toko Elektronik',
          },
        },
      },
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
    });

    const root = renderer!.root;
    const allText = root.findAllByType(Text).map((t) => t.props.children).flat().join(' ');

    expect(allText).toContain('Transaksi Gagal');
    expect(allText).toContain('Toko Elektronik');
  });

  it('harus memicu Clipboard.setStringAsync dan toast.success saat tombol Salin ditekan', async () => {
    mockRouteParams = {
      params: {
        transaction: {
          id: 'tx-copy-01',
          referenceId: 'GP-REF-COPY-12345',
          amount: 25000,
          status: 'completed',
        },
      },
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
    });

    const root = renderer!.root;
    // Temukan tombol salin berdasarkan Text 'Salin' di dalamnya
    const copyTextComponent = root.findAllByType(Text).find((t) => t.props.children === 'Salin');
    expect(copyTextComponent).toBeDefined();

    const copyTouchable = root.findAllByType(TouchableOpacity).find((touch) => {
      try {
        return touch.findAllByType(Text).some((t) => t.props.children === 'Salin');
      } catch {
        return false;
      }
    });

    expect(copyTouchable).toBeDefined();

    await ReactTestRenderer.act(async () => {
      await copyTouchable!.props.onPress();
    });

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('GP-REF-COPY-12345');
    const toastState = useFeedbackStore.getState().toast;
    expect(toastState?.isVisible).toBe(true);
    expect(toastState?.type).toBe('success');
    expect(toastState?.message).toBe('Nomor referensi berhasil disalin!');
  });

  it('harus memanggil Share.share saat tombol Bagikan Bukti Transaksi ditekan', async () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });

    mockRouteParams = {
      params: {
        transaction: {
          referenceId: 'GP-REF-SHARE-999',
          amount: 120000,
          status: 'completed',
          counterparty: { username: 'Rian Pratama' },
        },
      },
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
    });

    const root = renderer!.root;
    const shareTouchable = root.findAllByType(TouchableOpacity).find((touch) => {
      try {
        return touch.findAllByType(Text).some((t) => t.props.children === 'Bagikan Bukti Transaksi');
      } catch {
        return false;
      }
    });

    expect(shareTouchable).toBeDefined();

    await ReactTestRenderer.act(async () => {
      await shareTouchable!.props.onPress();
    });

    expect(shareSpy).toHaveBeenCalledTimes(1);
    expect(shareSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Bukti Transaksi GreenPay',
        message: expect.stringContaining('BUKTI TRANSAKSI GREENPAY E-WALLET'),
      })
    );
  });

  it('harus bernavigasi ke "MainTab" saat tombol Kembali ke Beranda ditekan', () => {
    mockRouteParams = {
      params: {
        transaction: {
          amount: 10000,
          status: 'completed',
        },
      },
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
    });

    const root = renderer!.root;
    const homeTouchable = root.findAllByType(TouchableOpacity).find((touch) => {
      try {
        return touch.findAllByType(Text).some((t) => t.props.children === 'Kembali ke Beranda');
      } catch {
        return false;
      }
    });

    expect(homeTouchable).toBeDefined();

    ReactTestRenderer.act(() => {
      homeTouchable!.props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('MainTab');
  });

  it('harus menangani kondisi tanpa params secara graceful (Edge Case)', () => {
    mockRouteParams = {};

    let renderer: ReactTestRenderer.ReactTestRenderer;
    expect(() => {
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
      });
    }).not.toThrow();

    const root = renderer!.root;
    const allText = root.findAllByType(Text).map((t) => t.props.children).flat().join(' ');
    expect(allText).toContain('GreenPay Network');
    expect(allText).toContain('Bukti Transaksi');
  });
});
