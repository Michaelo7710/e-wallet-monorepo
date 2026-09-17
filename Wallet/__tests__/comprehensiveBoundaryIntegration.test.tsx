import React from 'react';
import { Share, TouchableOpacity, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import TransactionDetailScreen from '../src/features/payment/screens/TransactionDetailScreen';
import { useFeedbackStore } from '../src/core/feedback/feedback.store';
import { maskBankAccount, maskPhoneNumber, maskIdentifier } from '../src/shared/utils/masking';
const { auditContent, scanDirectory } = require('../scripts/ci/guard-anti-alert.js');
const path = require('path');

// Mocks & Setup
const mockNavigate = jest.fn();
let mockRouteParams: any = {};

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

describe('TASK-QA-03: Comprehensive Integration & Boundary Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFeedbackStore.setState({ dialog: null, dialogQueue: [], toast: null });
  });

  const extractAllText = (root: ReactTestRenderer.ReactTestInstance): string => {
    return root.findAllByType(Text).map((t) => t.props.children).flat().join(' ');
  };

  const findShareButton = (root: ReactTestRenderer.ReactTestInstance) => {
    return root.findAllByType(TouchableOpacity).find((touch) => {
      try {
        return touch.findAllByType(Text).some((t) =>
          t.props.children === 'Bagikan Bukti Transaksi' || t.props.children === 'Resi Belum Terverifikasi'
        );
      } catch {
        return false;
      }
    });
  };

  // ==========================================================================
  // PILLAR 1: CANONICAL SERVER DATA INTEGRATION & STATUS MATRIX
  // ==========================================================================
  describe('Pillar 1: Resi Berbasis Canonical Data Server', () => {
    it('harus merender nomor referensi resmi server secara presisi tanpa modifikasi client', () => {
      mockRouteParams = {
        params: {
          transaction: {
            id: 'tx-canon-001',
            referenceNumber: 'GP-SERVER-CANONICAL-998877',
            amount: 150000,
            status: 'completed',
            type: 'transfer',
            description: 'Pembayaran Tagihan',
            createdAt: '2026-09-17T10:00:00.000Z',
          },
        },
      };

      let renderer: any;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
      });

      const allText = extractAllText(renderer.root);
      expect(allText).toContain('GP-SERVER-CANONICAL-998877');
      expect(allText).toContain('Transaksi Berhasil');
    });

    it('harus memvalidasi batas batas ambang AML (Boundary Value: Rp 10.000.000)', () => {
      // 1. Tepat di bawah ambang AML (Rp 9.999.999) -> Transaksi Berhasil
      mockRouteParams = {
        params: {
          transaction: {
            id: 'tx-below-aml',
            referenceNumber: 'GP-REF-9999999',
            amount: 9999999,
            status: 'completed',
            type: 'transfer',
          },
        },
      };

      let renderer: any;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
      });
      let allText = extractAllText(renderer.root);
      expect(allText).toContain('Transaksi Berhasil');

      // 2. Tepat di batas ambang AML (Rp 10.000.000) -> Menunggu Persetujuan (AML)
      mockRouteParams = {
        params: {
          transaction: {
            id: 'tx-at-aml',
            referenceNumber: 'GP-REF-10M',
            amount: 10000000,
            status: 'completed',
            type: 'transfer',
          },
        },
      };

      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
      });
      allText = extractAllText(renderer.root);
      expect(allText).toContain('Menunggu Persetujuan (AML)');

      // 3. Status pending_approval eksplisit dari server -> Menunggu Persetujuan (AML)
      mockRouteParams = {
        params: {
          transaction: {
            id: 'tx-pending-aml',
            referenceNumber: 'GP-REF-FLAGGED',
            amount: 1000000,
            status: 'pending_approval',
            isHighValue: true,
            type: 'transfer',
          },
        },
      };

      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
      });
      allText = extractAllText(renderer.root);
      expect(allText).toContain('Menunggu Persetujuan (AML)');
    });

    it('harus memvalidasi pemetaan status gagal dan penolakan transaksi finansial', () => {
      // Skenario Failed
      mockRouteParams = {
        params: {
          transaction: {
            id: 'tx-fail-1',
            referenceNumber: 'GP-REF-FAIL',
            amount: 250000,
            status: 'failed',
            type: 'transfer',
          },
        },
      };

      let renderer: any;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
      });
      let allText = extractAllText(renderer.root);
      expect(allText).toContain('Transaksi Gagal');

      // Skenario Rejected (Ditolak AML / Bank)
      mockRouteParams = {
        params: {
          transaction: {
            id: 'tx-reject-1',
            referenceNumber: 'GP-REF-REJECTED',
            amount: 500000,
            status: 'rejected',
            type: 'withdrawal',
          },
        },
      };

      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
      });
      allText = extractAllText(renderer.root);
      expect(allText).toContain('Transaksi Gagal');
    });
  });

  // ==========================================================================
  // PILLAR 2: SENSITIVE FINANCIAL DATA MASKING & UU PDP COMPLIANCE
  // ==========================================================================
  describe('Pillar 2: Masking Data Finansial & Perlindungan UU PDP', () => {
    it('harus melakukan Boundary Value Analysis pada masker nomor rekening bank', () => {
      // 1. Akun Standar 10-digit
      expect(maskBankAccount('1234567890')).toBe('******7890');
      // 2. Akun Virtual / Kartu 16-digit
      expect(maskBankAccount('1234567812345678')).toBe('************5678');
      // 3. Akun Pendek (<= 4 digit: seluruhnya disamarkan bintang)
      expect(maskBankAccount('123')).toBe('***');
      expect(maskBankAccount('1234')).toBe('****');
      // 4. Input Kosong / Null / Invalid
      expect(maskBankAccount('')).toBe('-');
      expect(maskBankAccount('   ')).toBe('-');
      expect(maskBankAccount(null as any)).toBe('-');
      expect(maskBankAccount(undefined as any)).toBe('-');
    });

    it('harus melakukan Boundary Value Analysis pada masker nomor ponsel', () => {
      // 1. Format Ponsel Indonesia Standar 12-digit
      expect(maskPhoneNumber('081234568901')).toBe('0812****8901');
      // 2. Format Ponsel 11-digit
      expect(maskPhoneNumber('08123456789')).toBe('0812****6789');
      // 3. Format Internasional +62
      expect(maskPhoneNumber('+6281234567890')).toBe('+628****7890');
      // 4. Nomor Ponsel Pendek (<= 4 digit: seluruhnya bintang; <= 8 digit: prefix 2 suffix 2)
      expect(maskPhoneNumber('0812')).toBe('****');
      expect(maskPhoneNumber('08123456')).toBe('08****56');
      // 5. Input Kosong / Null
      expect(maskPhoneNumber('')).toBe('-');
      expect(maskPhoneNumber(null as any)).toBe('-');
    });

    it('harus memvalidasi fungsi pintar maskIdentifier (Auto-detect & Explicit Length)', () => {
      expect(maskIdentifier('081299998888')).toBe('********8888');
      expect(maskIdentifier('5270123456')).toBe('******3456');
      expect(maskIdentifier('1234567890', 4)).toBe('******7890');
      expect(maskIdentifier('1234567890', 2)).toBe('********90');
      expect(maskIdentifier('', 4)).toBe('-');
    });

    it('harus menjamin native share payload 100% steril dari kebocoran nomor rekening & HP plaintext', async () => {
      const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });

      mockRouteParams = {
        params: {
          transaction: {
            id: 'tx-pdp-audit',
            referenceNumber: 'GP-REF-PDP-001',
            amount: 2500000,
            status: 'completed',
            type: 'withdrawal',
            targetAccount: '527099991234',
            bankName: 'BCA',
          },
        },
      };

      let renderer: any;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
      });

      const shareButton = findShareButton(renderer.root);
      expect(shareButton).toBeDefined();

      await ReactTestRenderer.act(async () => {
        await shareButton!.props.onPress();
      });

      expect(shareSpy).toHaveBeenCalledTimes(1);
      const shareCallArg = shareSpy.mock.calls[0][0];
      const messageContent = shareCallArg.message;

      // Harus memuat rekening ter-masking
      expect(messageContent).toContain('******1234');
      // DILARANG KERAS memuat nomor rekening lengkap
      expect(messageContent).not.toContain('527099991234');
    });
  });

  // ==========================================================================
  // PILLAR 3: SERVER REFERENCE STRICT VALIDATION & REJECTION
  // ==========================================================================
  describe('Pillar 3: Penolakan Resi Tanpa Server Reference', () => {
    it('harus menolak resi tanpa server reference, mengaktifkan status unverified, dan menonaktifkan share', async () => {
      const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });

      mockRouteParams = {
        params: {
          transaction: {
            amount: 100000,
            status: 'completed',
            type: 'transfer',
            // referenceNumber, referenceId, transactionId, id KOSONG
          },
        },
      };

      let renderer: any;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TransactionDetailScreen />);
      });

      const root = renderer.root;
      const allText = extractAllText(root);

      // 1. Status harus "Belum Terverifikasi"
      expect(allText).toContain('Belum Terverifikasi');

      // 2. Banner unverified harus tampil
      expect(allText).toContain('Peringatan: Transaksi ini belum memiliki nomor referensi resmi server (Unverified)');

      // 3. Teks referensi harus "Menunggu Verifikasi Server"
      expect(allText).toContain('Menunggu Verifikasi Server');

      // 4. Tombol Bagikan Bukti Transaksi harus berstatus disabled
      const shareButton = findShareButton(root);
      expect(shareButton?.props.disabled).toBe(true);

      // 5. Mencoba menekan tombol share tidak boleh memicu Share.share
      await ReactTestRenderer.act(async () => {
        if (shareButton?.props.onPress) {
          await shareButton.props.onPress();
        }
      });
      expect(shareSpy).not.toHaveBeenCalled();

      // 6. Tidak boleh ada nomor acak palsu client seperti 'GP-TRX-'
      const stringified = JSON.stringify(renderer.toJSON());
      expect(stringified).not.toContain('GP-TRX-');
    });
  });

  // ==========================================================================
  // PILLAR 4: ANTI-ALERT DEVOPS CI GUARD MULTI-LINE & REQUIRE ENGINE
  // ==========================================================================
  describe('Pillar 4: Multi-line & Require Detection Guard Anti-Alert', () => {
    it('harus mendeteksi impor multi-baris berformat ekstrem dengan spasi dan koma bertingkat', () => {
      const edgeCaseImportCode = `
import {
  StyleSheet,
  View,
  Text,
  Alert,
  TouchableOpacity,
} from 'react-native';
      `;

      const violations = auditContent(edgeCaseImportCode, 'test/ExtremeMultiLine.tsx');
      expect(violations.length).toBe(1);
      expect(violations[0].type).toBe('FORBIDDEN_IMPORT');
      expect(violations[0].file).toBe('test/ExtremeMultiLine.tsx');
      expect(violations[0].line).toBe(2);
    });

    it('harus mendeteksi impor ber-alias dan re-exporting Alert', () => {
      const aliasImportCode = `import { Alert as SystemAlert } from 'react-native';`;
      const reExportCode = `export { Alert } from 'react-native';`;

      const v1 = auditContent(aliasImportCode, 'test/Alias.ts');
      const v2 = auditContent(reExportCode, 'test/ReExport.ts');

      expect(v1.length).toBe(1);
      expect(v1[0].type).toBe('FORBIDDEN_IMPORT');

      expect(v2.length).toBe(1);
      expect(v2[0].type).toBe('FORBIDDEN_IMPORT');
    });

    it('harus mendeteksi seluruh permutasi require("react-native")', () => {
      // 1. Destructured multi-line require
      const code1 = `
const {
  Alert
} = require('react-native');
      `;
      // 2. Destructured with alias
      const code2 = `const { Alert: ModalAlert } = require('react-native');`;
      // 3. Direct property access
      const code3 = `const Alert = require('react-native').Alert;`;
      // 4. Inline invocation
      const code4 = `require('react-native').Alert.alert('Simulasi', 'Error');`;

      expect(auditContent(code1, '1.js').length).toBe(1);
      expect(auditContent(code2, '2.js').length).toBe(1);
      expect(auditContent(code3, '3.js').length).toBe(1);
      expect(auditContent(code4, '4.js').length).toBeGreaterThanOrEqual(1);
    });

    it('harus mengabaikan komentar satu baris dan multi-baris demi zero false-positives', () => {
      const cleanWithDocstrings = `
/**
 * Dokumentasi Sistem:
 * Dilarang menggunakan import { Alert } from 'react-native';
 * Sebaliknya gunakan feedback.dialog.*
 */
// const { Alert } = require('react-native');
import { feedback } from '@core/feedback';

export const safeFunction = () => {
  /* Alert.alert('Test'); */
  feedback.toast.info('Kode bersih dan steril');
};
      `;

      const violations = auditContent(cleanWithDocstrings, 'src/SafeService.ts');
      expect(violations.length).toBe(0);
    });

    it('harus memverifikasi bahwa 100% berkas produksi di folder src/ lolos tanpa pelanggaran', () => {
      const rootSrc = path.resolve(__dirname, '../src');
      const results = scanDirectory(rootSrc);

      expect(results.violations.length).toBe(0);
      expect(results.totalFilesScanned).toBeGreaterThanOrEqual(100);
    });
  });
});
