import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';

import { UserLayout } from '@shared/layouts';
import { colors, typography, spacing } from '@core/theme';
import { PendingWithdrawal } from '@domain/repositories/admin.repository.interface';
import {
  usePendingWithdrawals,
  useApproveWithdrawalMutation,
  useRejectWithdrawalMutation,
} from '../hooks/useAdminData';

const AdminWithdrawalApprovalScreen = () => {
  const navigation = useNavigation();
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePendingWithdrawals();
  const withdrawals = data?.pages.flatMap((page) => page.items) ?? [];
  const { mutate: approve, isPending: isApproving } = useApproveWithdrawalMutation();
  const { mutate: reject, isPending: isRejecting } = useRejectWithdrawalMutation();

  const handleApprove = (item: PendingWithdrawal) => {
    Alert.alert(
      'Konfirmasi Pencairan',
      `Setujui pencairan Rp ${item.amount.toLocaleString('id-ID')} ke ${item.bankName} (${item.accountNumber}) a.n ${item.accountName}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Setujui',
          onPress: () => {
            approve(item.id, {
              onSuccess: () => Alert.alert('Sukses', 'Penarikan dana berhasil disetujui.'),
              onError: (err: any) => Alert.alert('Gagal', err.message || 'Gagal memproses'),
            });
          },
        },
      ]
    );
  };

  const handleReject = (item: PendingWithdrawal) => {
    Alert.alert('Tolak Permintaan', `Tolak pencairan dana untuk ${item.username}?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Tolak',
        style: 'destructive',
        onPress: () => {
          reject(
            { id: item.id, reason: 'Ditolak oleh Administrator' },
            {
              onSuccess: () => Alert.alert('Selesai', 'Permintaan penarikan telah ditolak.'),
              onError: (err: any) => Alert.alert('Gagal', err.message || 'Gagal menolak'),
            }
          );
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: PendingWithdrawal }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.amount}>Rp {item.amount.toLocaleString('id-ID')}</Text>
      </View>

      <View style={styles.bankDetail}>
        <Ionicons name="business-outline" size={16} color={colors.textMuted} />
        <Text style={styles.bankText}>
          {item.bankName} - {item.accountNumber} ({item.accountName})
        </Text>
      </View>

      <Text style={styles.dateText}>
        Diajukan pada: {dayjs(item.createdAt).format('D MMMM YYYY, HH:mm')}
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnReject]}
          onPress={() => handleReject(item)}
          disabled={isApproving || isRejecting}
        >
          <Text style={styles.btnRejectText}>Tolak</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnApprove]}
          onPress={() => handleApprove(item)}
          disabled={isApproving || isRejecting}
        >
          <Text style={styles.btnApproveText}>Setujui</Text>
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
        <Text style={styles.headerTitle}>Antrean Pencairan Dana</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={withdrawals}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onRefresh={refetch}
          refreshing={isRefetching}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          windowSize={5}
          maxToRenderPerBatch={10}
          initialNumToRender={8}
          removeClippedSubviews={Platform.OS === 'android'}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                style={{ paddingVertical: spacing.md }}
                color={colors.primary}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.success} />
              <Text style={styles.emptyText}>Semua antrean telah diproses!</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
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
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.radius.lg,
    marginBottom: spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  amount: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold as any,
    color: colors.primary,
  },
  bankDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 6,
  },
  bankText: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  dateText: {
    fontSize: typography.size.xs,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  btn: {
    paddingHorizontal: spacing.lg,
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

export default AdminWithdrawalApprovalScreen;