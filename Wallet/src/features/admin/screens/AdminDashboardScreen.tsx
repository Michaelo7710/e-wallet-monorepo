import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { feedback } from '@core/feedback';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserLayout } from '@shared/layouts';
import { colors, typography, spacing } from '@core/theme';
import { useAuthStore } from '@core/storage/useAuthStore';
import { queryClient } from '@core/network/queryClient';
import { useAdminStats } from '../hooks/useAdminData';

const AdminDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logoutSession } = useAuthStore();
  const { data: stats, refetch, isRefetching } = useAdminStats();

  const handleLogout = () => {
    feedback.dialog.confirm({
      title: 'Keluar Panel Admin',
      message: 'Apakah Anda yakin ingin keluar dari sesi Admin?',
      confirmText: 'Keluar',
      cancelText: 'Batal',
      isDestructive: true,
      onConfirm: async () => {
        await logoutSession();
        queryClient.clear();
      },
    });
  };

  const handleRefresh = async () => {
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ['admin'] }),
    ]);
  };

  const totalPendingQueue =
    (stats?.pendingWithdrawalsCount ?? 0) +
    (stats?.pendingTopupsCount ?? 0) +
    (stats?.pendingTransfersCount ?? 0);

  return (
    <UserLayout noPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Portal Administrator</Text>
            <Text style={styles.headerTitle}>Hai, {user?.username || 'Admin'}</Text>
          </View>
          <TouchableOpacity testID="btn-logout" style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {/* 1. Total Pengguna Terdaftar */}
          <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
            <Text style={styles.statLabel}>Total Pengguna</Text>
            <Text style={styles.statValue} testID="stat-total-users">
              {stats?.totalUsers ?? 0}
            </Text>
          </View>

          {/* 2. Total Antrean Pending */}
          <View style={[styles.statCard, { borderLeftColor: colors.warning }]}>
            <Text style={styles.statLabel}>Antrean Pending</Text>
            <Text style={[styles.statValue, { color: colors.warning }]} testID="stat-pending-queue">
              {totalPendingQueue}
            </Text>
          </View>

          {/* 3. Total Volume Transaksi */}
          <TouchableOpacity
            testID="action-card-volume"
            style={[styles.statCardFull, { borderLeftColor: colors.info, marginBottom: spacing.md }]}
            onPress={() => navigation.navigate('AdminFinancialReport')}
            activeOpacity={0.7}
          >
            <View style={styles.statHeaderRow}>
              <Text style={styles.statLabel}>Total Volume Transaksi</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.info} />
            </View>
            <Text style={styles.statValueLarge} testID="stat-total-volume">
              Rp {(stats?.totalVolume ?? 0).toLocaleString('id-ID')}
            </Text>
          </TouchableOpacity>

          {/* 4. Likuiditas Dompet Beredar */}
          <TouchableOpacity
            testID="action-card-liquidity"
            style={[styles.statCardFull, { borderLeftColor: colors.success }]}
            onPress={() => navigation.navigate('AdminFinancialReport')}
            activeOpacity={0.7}
          >
            <View style={styles.statHeaderRow}>
              <Text style={styles.statLabel}>Likuiditas Dompet Beredar</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.success} />
            </View>
            <Text style={[styles.statValueLarge, { color: colors.success }]} testID="stat-total-liquidity">
              Rp {(stats?.totalLiquidity ?? 0).toLocaleString('id-ID')}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Aksi Manajemen</Text>

        {/* 1. Persetujuan Penarikan */}
        <TouchableOpacity
          testID="action-withdrawals"
          style={styles.actionCard}
          onPress={() => navigation.navigate('AdminApprovals')}
          activeOpacity={0.7}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.warning}15` }]}>
              <Ionicons name="shield-checkmark" size={26} color={colors.warning} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Persetujuan Penarikan</Text>
              <Text style={styles.actionSubtitle}>Verifikasi dan cairkan dana nasabah</Text>
            </View>
          </View>
          <View style={styles.actionRight}>
            {(stats?.pendingWithdrawalsCount ?? 0) > 0 && (
              <View style={styles.badge} testID="badge-pending-withdrawals">
                <Text style={styles.badgeText}>{stats?.pendingWithdrawalsCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={22} color={colors.textLight} />
          </View>
        </TouchableOpacity>

        {/* 2. Persetujuan Top Up Manual */}
        <TouchableOpacity
          testID="action-topups"
          style={styles.actionCard}
          onPress={() => navigation.navigate('AdminTopUpApprovals')}
          activeOpacity={0.7}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="wallet-outline" size={26} color={colors.primary} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Persetujuan Top Up Manual</Text>
              <Text style={styles.actionSubtitle}>Verifikasi permohonan deposit saldo pengguna</Text>
            </View>
          </View>
          <View style={styles.actionRight}>
            {(stats?.pendingTopupsCount ?? 0) > 0 && (
              <View style={styles.badge} testID="badge-pending-topups">
                <Text style={styles.badgeText}>{stats?.pendingTopupsCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={22} color={colors.textLight} />
          </View>
        </TouchableOpacity>

        {/* 3. Kliring Transfer AML */}
        <TouchableOpacity
          testID="action-transfers"
          style={styles.actionCard}
          onPress={() => navigation.navigate('AdminTransferApprovals')}
          activeOpacity={0.7}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.info}15` }]}>
              <Ionicons name="swap-horizontal-outline" size={26} color={colors.info} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Kliring Transfer AML</Text>
              <Text style={styles.actionSubtitle}>Tinjau transaksi bernilai besar (&#8805; Rp 10 Juta)</Text>
            </View>
          </View>
          <View style={styles.actionRight}>
            {(stats?.pendingTransfersCount ?? 0) > 0 && (
              <View style={styles.badge} testID="badge-pending-transfers">
                <Text style={styles.badgeText}>{stats?.pendingTransfersCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={22} color={colors.textLight} />
          </View>
        </TouchableOpacity>

        {/* 4. Rekening Bank Master */}
        <TouchableOpacity
          testID="action-banks"
          style={styles.actionCard}
          onPress={() => navigation.navigate('AdminBankManagement')}
          activeOpacity={0.7}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.primaryDark}15` }]}>
              <Ionicons name="card-outline" size={26} color={colors.primaryDark} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Rekening Bank Master</Text>
              <Text style={styles.actionSubtitle}>Kelola rekening penampung platform</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textLight} />
        </TouchableOpacity>

        {/* 5. Laporan Neraca Keuangan */}
        <TouchableOpacity
          testID="action-financial-report"
          style={styles.actionCard}
          onPress={() => navigation.navigate('AdminFinancialReport')}
          activeOpacity={0.7}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="analytics-outline" size={26} color={colors.success} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Laporan Neraca Keuangan</Text>
              <Text style={styles.actionSubtitle}>Analisis likuiditas, peredaran uang & arus kas</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textLight} />
        </TouchableOpacity>

        {/* 6. Manajemen Pengguna */}
        <TouchableOpacity
          testID="action-users"
          style={styles.actionCard}
          onPress={() => navigation.navigate('AdminUserManagement')}
          activeOpacity={0.7}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.primaryDark}15` }]}>
              <Ionicons name="people-outline" size={26} color={colors.primaryDark} />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionTitle}>Manajemen Pengguna</Text>
              <Text style={styles.actionSubtitle}>Direktori akun, status KYC & kontrol anti-fraud</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.textLight} />
        </TouchableOpacity>
      </ScrollView>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  headerSubtitle: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.bold as any,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  logoutBtn: {
    padding: spacing.sm,
    backgroundColor: `${colors.error}15`,
    borderRadius: spacing.radius.full,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.radius.md,
    borderLeftWidth: 4,
    elevation: 2,
    marginBottom: spacing.md,
  },
  statCardFull: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.radius.md,
    borderLeftWidth: 4,
    elevation: 2,
  },
  statHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.medium as any,
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    marginTop: 4,
  },
  statValueLarge: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold as any,
    color: colors.info,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMain,
    marginBottom: spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.radius.lg,
    marginBottom: spacing.md,
    elevation: 2,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: spacing.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMain,
  },
  actionSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: spacing.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold as any,
  },
});

export default AdminDashboardScreen;