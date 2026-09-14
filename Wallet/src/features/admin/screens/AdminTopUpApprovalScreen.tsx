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
import { PendingTopUp } from '@domain/repositories/admin.repository.interface';
import {
  usePendingTopUps,
  useApproveTopUpMutation,
  useCancelTopUpMutation,
} from '../hooks/useAdminData';

const AdminTopUpApprovalScreen = () => {
  const navigation = useNavigation();
  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePendingTopUps();
  const topups = data?.pages.flatMap((page) => page.items) ?? [];
  const { mutate: approveTopUp, isPending: isApproving } = useApproveTopUpMutation();
  const { mutate: cancelTopUp, isPending: isCanceling } = useCancelTopUpMutation();

  const handleApprove = (item: PendingTopUp) => {
    Alert.alert(
      'Konfirmasi Top Up',
      `Setujui penambahan saldo Rp ${item.amount.toLocaleString('id-ID')} untuk ${item.user.username}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Setujui',
          onPress: () => {
            approveTopUp(item.id, {
              onSuccess: () => Alert.alert('Sukses', 'Permohonan top up berhasil disetujui.'),
              onError: (err: any) =>
                Alert.alert('Gagal', err.response?.data?.message || err.message || 'Gagal memproses top up'),
            });
          },
        },
      ]
    );
  };

  const handleCancel = (item: PendingTopUp) => {
    Alert.alert(
      'Batalkan Permohonan',
      `Batalkan permohonan top up untuk ${item.user.username}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Batalkan',
          style: 'destructive',
          onPress: () => {
            cancelTopUp(item.id, {
              onSuccess: () => Alert.alert('Selesai', 'Permohonan top up telah dibatalkan.'),
              onError: (err: any) =>
                Alert.alert('Gagal', err.response?.data?.message || err.message || 'Gagal membatalkan top up'),
            });
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: PendingTopUp }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user.username}</Text>
          <Text style={styles.userContact}>
            {item.user.phoneNumber || item.user.email}
          </Text>
        </View>
        <Text style={styles.amount}>Rp {item.amount.toLocaleString('id-ID')}</Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="receipt-outline" size={16} color={colors.textMuted} />
        <Text style={styles.detailText}>Ref: {item.referenceNumber}</Text>
      </View>

      {item.bankDetails ? (
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={16} color={colors.textMuted} />
          <Text style={styles.detailText}>
            Bank Tujuan: {item.bankDetails.bankName} - {item.bankDetails.accountNumber} ({item.bankDetails.accountName})
          </Text>
        </View>
      ) : (
        <View style={styles.detailRow}>
          <Ionicons name="card-outline" size={16} color={colors.textMuted} />
          <Text style={styles.detailText}>Metode: {item.paymentMethod.toUpperCase()}</Text>
        </View>
      )}

      <Text style={styles.dateText}>
        Diajukan pada: {dayjs(item.createdAt).format('D MMMM YYYY, HH:mm')}
      </Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnCancel]}
          onPress={() => handleCancel(item)}
          disabled={isApproving || isCanceling}
          activeOpacity={0.7}
        >
          <Text style={styles.btnCancelText}>Batalkan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnApprove]}
          onPress={() => handleApprove(item)}
          disabled={isApproving || isCanceling}
          activeOpacity={0.7}
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
        <Text style={styles.headerTitle}>Antrean Top Up Manual</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={topups}
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
              <Text style={styles.emptyText}>Semua antrean top up telah diproses!</Text>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  userInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  userName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  userContact: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold as any,
    color: colors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
    gap: 6,
  },
  detailText: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  dateText: {
    fontSize: typography.size.xs,
    color: colors.textLight,
    marginTop: 4,
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
  btnCancel: {
    backgroundColor: `${colors.error}15`,
  },
  btnCancelText: {
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

export default AdminTopUpApprovalScreen;
