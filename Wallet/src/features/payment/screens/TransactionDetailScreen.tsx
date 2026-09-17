import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';

import { colors, typography } from '@core/theme';
import { feedback } from '@core/feedback';

export interface TransactionDetailParams {
  transaction?: {
    id?: string;
    transactionId?: string;
    referenceId?: string;
    amount?: number;
    type?: string;
    status?: string;
    description?: string;
    receiverPhoneNumber?: string;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
    remainingBalance?: number;
    createdAt?: string;
    notes?: string;
    isHighValue?: boolean;
    counterparty?: {
      username?: string;
      phoneNumber?: string;
    };
  };
}

const TransactionDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const params = (route.params as TransactionDetailParams) || {};
  const tx = params.transaction || {};

  const amount = tx.amount || 0;
  const rawRef =
    tx.referenceId ||
    tx.transactionId ||
    tx.id ||
    `GP-TRX-${dayjs().format('YYYYMMDD-HHmmss')}`;

  const isPendingAml =
    tx.status === 'pending_approval' || tx.isHighValue || amount >= 10000000;
  const isFailed = tx.status === 'failed' || tx.status === 'rejected';

  const statusLabel = isFailed
    ? 'Transaksi Gagal'
    : isPendingAml
    ? 'Menunggu Persetujuan (AML)'
    : 'Transaksi Berhasil';

  const statusColor = isFailed
    ? colors.error
    : isPendingAml
    ? colors.warning
    : colors.success;

  const statusIconName = isFailed
    ? ('alert-circle' as const)
    : isPendingAml
    ? ('time' as const)
    : ('checkmark-circle' as const);

  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

  const formattedDate = tx.createdAt
    ? dayjs(tx.createdAt).format('D MMMM YYYY, HH:mm [WIB]')
    : dayjs().format('D MMMM YYYY, HH:mm [WIB]');

  const targetName =
    tx.counterparty?.username ||
    tx.accountName ||
    tx.receiverPhoneNumber ||
    tx.description ||
    'GreenPay Network';

  const handleCopyRef = async () => {
    try {
      await Clipboard.setStringAsync(rawRef);
      feedback.toast.success('Nomor referensi berhasil disalin!');
    } catch {
      feedback.toast.error('Gagal menyalin nomor referensi');
    }
  };

  const handleShareReceipt = async () => {
    try {
      const shareMessage = `BUKTI TRANSAKSI GREENPAY E-WALLET\n` +
        `------------------------------------\n` +
        `Status: ${statusLabel}\n` +
        `Nominal: ${formattedAmount}\n` +
        `Tujuan: ${targetName}\n` +
        `Nomor Ref: ${rawRef}\n` +
        `Waktu: ${formattedDate}\n` +
        `------------------------------------\n` +
        `Bukti sah dikeluarkan oleh sistem resmi GreenPay FinTech.`;

      await Share.share({
        message: shareMessage,
        title: 'Bukti Transaksi GreenPay',
      });
    } catch (err: any) {
      feedback.toast.error(err.message || 'Gagal membagikan struk');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Thematic Ambient Curved Header */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ambientHeader}
      >
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.navigate('MainTab')}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Bukti Transaksi</Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleShareReceipt}
            activeOpacity={0.7}
          >
            <Ionicons name="share-social-outline" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Status Bubble */}
        <View style={styles.statusBubbleWrapper}>
          <View style={[styles.statusIconCircle, { shadowColor: statusColor }]}>
            <Ionicons name={statusIconName} size={42} color={statusColor} />
          </View>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </LinearGradient>

      {/* Main Voucher Receipt Card */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.receiptCard}>
          {/* Nominal Display */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total Nominal</Text>
            <Text style={styles.amountValue}>{formattedAmount}</Text>
          </View>

          {/* Perforated Dashed Divider */}
          <View style={styles.perforatedRow}>
            <View style={[styles.notch, styles.notchLeft]} />
            <View style={styles.dashedLine} />
            <View style={[styles.notch, styles.notchRight]} />
          </View>

          {/* Transaction Metadata List */}
          <View style={styles.metaContainer}>
            <DetailRow label="Jenis Transaksi" value={tx.type?.toUpperCase() || 'P2P TRANSFER'} />
            <DetailRow label="Penerima / Tujuan" value={targetName} />
            {tx.bankName ? (
              <DetailRow label="Bank Tujuan" value={`${tx.bankName} (${tx.accountNumber || '-'})`} />
            ) : null}
            <View style={styles.refIdRow}>
              <View style={styles.refTextCol}>
                <Text style={styles.metaLabel}>Nomor Referensi</Text>
                <Text style={styles.refValueText} numberOfLines={1}>
                  {rawRef}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyRef}
                activeOpacity={0.7}
              >
                <Ionicons name="copy-outline" size={16} color={colors.primary} />
                <Text style={styles.copyButtonText}>Salin</Text>
              </TouchableOpacity>
            </View>
            <DetailRow label="Waktu Transaksi" value={formattedDate} />
            <DetailRow label="Biaya Layanan" value="Rp 0 (Gratis)" isFree />
            {tx.notes ? <DetailRow label="Catatan" value={tx.notes} /> : null}
          </View>

          {/* Security Seal */}
          <View style={styles.securitySeal}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text style={styles.securitySealText}>
              Terverifikasi Otentik • Enkripsi Kriptografis TLS 1.3
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareReceipt}
          activeOpacity={0.8}
        >
          <Ionicons name="share-social" size={18} color={colors.white} style={styles.btnIcon} />
          <Text style={styles.shareButtonText}>Bagikan Bukti Transaksi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('MainTab')}
          activeOpacity={0.7}
        >
          <Text style={styles.homeButtonText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  isFree?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, isFree }) => (
  <View style={styles.metaRow}>
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={[styles.metaValue, isFree && styles.freeValue]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  ambientHeader: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  navTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.white,
  },
  statusBubbleWrapper: {
    alignItems: 'center',
    marginTop: 12,
  },
  statusIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 10,
  },
  statusText: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  receiptCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountValue: {
    fontSize: typography.size.xxl,
    fontWeight: '800',
    color: colors.textMain,
  },
  perforatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    position: 'relative',
    marginHorizontal: -12,
  },
  notch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    position: 'absolute',
  },
  notchLeft: {
    left: -12,
  },
  notchRight: {
    right: -12,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginHorizontal: 16,
  },
  metaContainer: {
    padding: 20,
    gap: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    fontWeight: '500',
  },
  metaValue: {
    fontSize: typography.size.sm,
    color: colors.textMain,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
  freeValue: {
    color: colors.success,
  },
  refIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refTextCol: {
    flex: 1,
    marginRight: 12,
  },
  refValueText: {
    fontSize: typography.size.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.textMain,
    fontWeight: '600',
    marginTop: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
  },
  copyButtonText: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  securitySeal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  securitySealText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  bottomBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  shareButton: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    fontSize: typography.size.sm,
    fontWeight: '700',
    color: colors.white,
  },
  homeButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
});

export default TransactionDetailScreen;
