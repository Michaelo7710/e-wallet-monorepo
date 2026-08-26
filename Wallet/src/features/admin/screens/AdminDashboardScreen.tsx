import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserLayout } from '@shared/layouts';
import { colors, typography, spacing } from '@core/theme';
import { useAuthStore } from '@core/storage/useAuthStore';
import { useAdminStats } from '../hooks/useAdminData';

const AdminDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logoutSession } = useAuthStore();
  const { data: stats, refetch, isRefetching } = useAdminStats();

  const handleLogout = () => {
    Alert.alert('Keluar Panel Admin', 'Apakah Anda yakin ingin keluar dari sesi Admin?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: async () => await logoutSession() },
    ]);
  };

  return (
    <UserLayout noPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Portal Administrator</Text>
            <Text style={styles.headerTitle}>Hai, {user?.username || 'Admin'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: colors.primary }]}>
            <Text style={styles.statLabel}>Total Pengguna</Text>
            <Text style={styles.statValue}>{stats?.totalUsers ?? 0}</Text>
          </View>

          <View style={[styles.statCard, { borderLeftColor: colors.warning }]}>
            <Text style={styles.statLabel}>Penarikan Pending</Text>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              {stats?.pendingWithdrawalsCount ?? 0}
            </Text>
          </View>

          <View style={[styles.statCardFull, { borderLeftColor: colors.info }]}>
            <Text style={styles.statLabel}>Total Volume Transaksi</Text>
            <Text style={styles.statValueLarge}>
              Rp {(stats?.totalVolume ?? 0).toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Aksi Manajemen</Text>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('AdminApprovals')}
          activeOpacity={0.7}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.iconBox, { backgroundColor: `${colors.warning}15` }]}>
              <Ionicons name="shield-checkmark" size={26} color={colors.warning} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Persetujuan Penarikan</Text>
              <Text style={styles.actionSubtitle}>Verifikasi dan cairkan dana nasabah</Text>
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
    elevation: 2,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: spacing.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
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
});

export default AdminDashboardScreen;