import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';

import { UserLayout } from '@shared/layouts';
import { colors, typography, spacing } from '@core/theme';
import { PendingTransfer } from '@domain/repositories/admin.repository.interface';
import {
  usePendingTransfers,
  useApproveTransferMutation,
  useRejectTransferMutation,
} from '../hooks/useAdminData';

const AdminTransferApprovalScreen = () => {
  const navigation = useNavigation();
  const { data: transfers, isLoading, refetch, isRefetching } = usePendingTransfers();
  const { mutate: approveTransfer, isPending: isApproving } = useApproveTransferMutation();
  const { mutate: rejectTransfer, isPending: isRejecting } = useRejectTransferMutation();

  const handleApprove = (item: PendingTransfer) => {
    Alert.alert(
      'Konfirmasi Kliring Transfer',
      `Setujui transfer dana sebesar Rp ${item.amount.toLocaleString('id-ID')} dari ${item.sender.username} ke ${item.receiver.username}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Setujui & Teruskan',
          onPress: () => {
            approveTransfer(item.id, {
              onSuccess: () =>
                Alert.alert('Sukses', 'Transfer dana berhasil disetujui dan diteruskan ke penerima.'),
              onError: (err: any) =>
                Alert.alert('Gagal', err.response?.data?.message || err.message || 'Gagal menyetujui transfer'),
            });
          },
        },
      ]
    );
  };

  const handleReject = (item: PendingTransfer) => {
    Alert.alert(
      'Tolak & Refund Transfer',
      `Tolak transaksi transfer ini dan pulangkan saldo Rp ${item.amount.toLocaleString('id-ID')} ke dompet ${item.sender.username}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tolak & Refund',
          style: 'destructive',
          onPress: () => {
            rejectTransfer(
              { transactionId: item.id, reason: 'Ditolak oleh kebijakan AML Administrator' },
              {
                onSuccess: () =>
                  Alert.alert('Selesai', 'Transfer ditolak dan saldo telah dipulangkan ke pengirim.'),
                onError: (err: any) =>
                  Alert.alert('Gagal', err.response?.data?.message || err.message || 'Gagal menolak transfer'),
              }
            );
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: PendingTransfer }) => (
    <View style={styles.card}>
      {/* AML Badge */}
      <View style={styles.amlBadge}>
        <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
        <Text style={styles.amlBadgeText}>Transaksi Skala Besar (&#8805; Rp 10 Juta)</Text>
      </View>

      <View style={styles.cardHeader}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Nominal Transfer</Text>
          <Text style={styles.amount}>Rp {item.amount.toLocaleString('id-ID')}</Text>
        </View>
        <Text style={styles.refId}>Ref: {item.referenceId}</Text>
      </View>

      {/* Transfer Flow */}
      <View style={styles.flowBox}>
        <View style={styles.partyRow}>
          <View style={[styles.partyDot, { backgroundColor: colors.error }]} />
          <View style={styles.partyInfo}>
            <Text style={styles.partyLabel}>Pengirim</Text>
            <Text style={styles.partyName}>
              {item.sender.username} ({item.sender.phoneNumber || item.sender.email})
            </Text>
          </View>
        </View>

        <View style={styles.flowArrowContainer}>
          <Ionicons name="arrow-down" size={16} color={colors.textLight} />
        </View>

        <View style={styles.partyRow}>
          <View style={[styles.partyDot, { backgroundColor: colors.success }]} />
          <View style={styles.partyInfo}>
            <Text style={styles.partyLabel}>Penerima</Text>
            <Text style={styles.partyName}>
              {item.receiver.username} ({item.receiver.phoneNumber || item.receiver.email})
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.dateText}>
        Diajukan pada: {dayjs(item.createdAt).format('D MMMM YYYY, HH:mm')}
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnReject]}
          onPress={() => handleReject(item)}
          disabled={isApproving || isRejecting}
          activeOpacity={0.7}
        >
          <Text style={styles.btnRejectText}>Tolak & Refund</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnApprove]}
          onPress={() => handleApprove(item)}
          disabled={isApproving || isRejecting}
          activeOpacity={0.7}
        >
          <Text style={styles.btnApproveText}>Setujui & Teruskan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <UserLayout noPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kliring Transfer AML</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={transfers ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.success} />
              <Text style={styles.emptyText}>Semua antrean transfer telah diproses!</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.size.md,
    color: colors.textMuted,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.radius.lg,
    marginBottom: spacing.md,
    elevation: 2,
  },
  amlBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${colors.warning}18`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.radius.sm,
    gap: 4,
    marginBottom: spacing.sm,
  },
  amlBadgeText: {
    fontSize: typography.size.xs,
    color: colors.warning,
    fontWeight: typography.weight.bold as any,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  amountContainer: {
    flex: 1,
  },
  amountLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  amount: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold as any,
    color: colors.primary,
    marginTop: 2,
  },
  refId: {
    fontSize: typography.size.xs,
    color: colors.textLight,
  },
  flowBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: spacing.radius.md,
    marginVertical: spacing.xs,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  partyInfo: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 10,
    color: colors.textLight,
    textTransform: 'uppercase',
    fontWeight: typography.weight.bold as any,
  },
  partyName: {
    fontSize: typography.size.sm,
    color: colors.textMain,
    fontWeight: typography.weight.medium as any,
  },
  flowArrowContainer: {
    paddingLeft: 12,
    paddingVertical: 2,
  },
  dateText: {
    fontSize: typography.size.xs,
    color: colors.textLight,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radius.md,
  },
  btnReject: {
    backgroundColor: `${colors.error}15`,
  },
  btnRejectText: {
    color: colors.error,
    fontWeight: typography.weight.semibold as any,
  },
  btnApprove: {
    backgroundColor: colors.primary,
  },
  btnApproveText: {
    color: colors.white,
    fontWeight: typography.weight.semibold as any,
  },
});

export default AdminTransferApprovalScreen;
