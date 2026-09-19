import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { feedback } from '@core/feedback';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserLayout } from '@shared/layouts';
import { colors, typography, spacing } from '@core/theme';
import { AdminUser } from '@domain/repositories/admin.repository.interface';
import {
  useAdminUsers,
  useFreezeUserMutation,
  useUnfreezeUserMutation,
} from '../hooks/useAdminUsers';

type TierFilter = 'all' | 'basic' | 'premium';
type StatusFilter = 'all' | 'active' | 'suspended';

const AdminUserManagementScreen = () => {
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<TierFilter>('all');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

  const tierParam = selectedTier === 'all' ? undefined : selectedTier;
  const isSuspendedParam =
    selectedStatus === 'all'
      ? undefined
      : selectedStatus === 'suspended';

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAdminUsers({
    search: searchQuery.trim() || undefined,
    tier: tierParam,
    is_suspended: isSuspendedParam,
  });

  const users = data?.pages.flatMap((page) => page.items) ?? [];
  const { mutateAsync: freezeUser, isPending: isFreezing } = useFreezeUserMutation();
  const { mutateAsync: unfreezeUser, isPending: isUnfreezing } = useUnfreezeUserMutation();

  const handleFreeze = (user: AdminUser) => {
    feedback.dialog.confirm({
      title: 'Bekukan Akun Pengguna',
      message: `Apakah Anda yakin ingin membekukan akun ${user.username}? Seluruh sesi aktif akan diputus dan transaksi akan diblokir.`,
      confirmText: 'Bekukan Akun',
      cancelText: 'Batal',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await freezeUser({
            id: user.id,
            reason: 'Ditangguhkan oleh Administrator',
          });
          feedback.toast.success(`Akun ${user.username} berhasil dibekukan.`);
        } catch (err: any) {
          feedback.dialog.error('Gagal Membekukan Akun', err.message || 'Terjadi kesalahan saat membekukan akun.');
        }
      },
    });
  };

  const handleUnfreeze = (user: AdminUser) => {
    feedback.dialog.confirm({
      title: 'Buka Blokir Pengguna',
      message: `Apakah Anda yakin ingin membuka blokir akun ${user.username}? Pengguna akan dapat login dan bertransaksi kembali.`,
      confirmText: 'Buka Blokir',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          await unfreezeUser(user.id);
          feedback.toast.success(`Akun ${user.username} telah diaktifkan kembali.`);
        } catch (err: any) {
          feedback.dialog.error('Gagal Membuka Blokir', err.message || 'Terjadi kesalahan saat membuka blokir.');
        }
      },
    });
  };

  const renderHeader = () => (
    <View style={styles.filterSection}>
      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={colors.textLight} style={styles.searchIcon} />
        <TextInput
          testID="input-search-user"
          style={styles.searchInput}
          placeholder="Cari nama, email, no. HP, NIK..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            testID="btn-clear-search"
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tier Filter Pills */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Tingkat Akun:</Text>
        <View style={styles.pillsRow}>
          <TouchableOpacity
            testID="filter-tier-all"
            style={[styles.pill, selectedTier === 'all' && styles.pillActive]}
            onPress={() => setSelectedTier('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, selectedTier === 'all' && styles.pillTextActive]}>Semua</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="filter-tier-basic"
            style={[styles.pill, selectedTier === 'basic' && styles.pillActive]}
            onPress={() => setSelectedTier('basic')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, selectedTier === 'basic' && styles.pillTextActive]}>Basic</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="filter-tier-premium"
            style={[styles.pill, selectedTier === 'premium' && styles.pillActive]}
            onPress={() => setSelectedTier('premium')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, selectedTier === 'premium' && styles.pillTextActive]}>Premium</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Filter Pills */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Status Akun:</Text>
        <View style={styles.pillsRow}>
          <TouchableOpacity
            testID="filter-status-all"
            style={[styles.pill, selectedStatus === 'all' && styles.pillActive]}
            onPress={() => setSelectedStatus('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, selectedStatus === 'all' && styles.pillTextActive]}>Semua</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="filter-status-active"
            style={[styles.pill, selectedStatus === 'active' && styles.pillActive]}
            onPress={() => setSelectedStatus('active')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, selectedStatus === 'active' && styles.pillTextActive]}>Aktif</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="filter-status-suspended"
            style={[styles.pill, selectedStatus === 'suspended' && styles.pillActive]}
            onPress={() => setSelectedStatus('suspended')}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, selectedStatus === 'suspended' && styles.pillTextActive]}>Dibekukan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;
    return (
      <View testID="empty-state" style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="people-outline" size={48} color={colors.textLight} />
        </View>
        <Text style={styles.emptyTitle}>Tidak ada pengguna ditemukan</Text>
        <Text style={styles.emptySubtitle}>
          Coba sesuaikan kata kunci pencarian atau filter status untuk menemukan pengguna.
        </Text>
      </View>
    );
  };

  const renderUserCard = ({ item: user }: { item: AdminUser }) => {
    const initials = (user.username || 'U').slice(0, 2).toUpperCase();

    return (
      <View testID={`user-card-${user.id}`} style={styles.userCard}>
        {/* Top Info Header */}
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <Text style={styles.username}>{user.username}</Text>
              {user.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>ADMIN</Text>
                </View>
              )}
            </View>
            <Text testID={`user-email-${user.id}`} style={styles.contactText}>
              {user.email}
            </Text>
            <Text testID={`user-phone-${user.id}`} style={styles.contactText}>
              {user.phoneNumber}
            </Text>
          </View>
        </View>

        {/* Badges & Meta Row */}
        <View style={styles.badgesRow}>
          {/* Tier Badge */}
          <View
            style={[
              styles.badge,
              user.accountTier === 'premium' ? styles.badgePremium : styles.badgeBasic,
            ]}
          >
            <Ionicons
              name={user.accountTier === 'premium' ? 'star' : 'person'}
              size={12}
              color={user.accountTier === 'premium' ? '#B45309' : colors.primary}
            />
            <Text
              style={[
                styles.badgeText,
                user.accountTier === 'premium'
                  ? styles.badgePremiumText
                  : styles.badgeBasicText,
              ]}
            >
              {user.accountTier.toUpperCase()}
            </Text>
          </View>

          {/* KYC Status Badge */}
          <View
            style={[
              styles.badge,
              user.isKycVerified ? styles.badgeSuccess : styles.badgeMuted,
            ]}
          >
            <Ionicons
              name={user.isKycVerified ? 'shield-checkmark' : 'shield-outline'}
              size={12}
              color={user.isKycVerified ? colors.success : colors.textLight}
            />
            <Text
              style={[
                styles.badgeText,
                user.isKycVerified ? styles.badgeSuccessText : styles.badgeMutedText,
              ]}
            >
              {user.isKycVerified ? 'KYC Terverifikasi' : 'Belum KYC'}
            </Text>
          </View>

          {/* Suspension Status Badge */}
          {user.isSuspended ? (
            <View testID={`badge-suspended-${user.id}`} style={[styles.badge, styles.badgeDanger]}>
              <Ionicons name="lock-closed" size={12} color={colors.error} />
              <Text style={[styles.badgeText, styles.badgeDangerText]}>DIBEKUKAN</Text>
            </View>
          ) : (
            <View testID={`badge-active-${user.id}`} style={[styles.badge, styles.badgeSuccess]}>
              <Ionicons name="checkmark-circle" size={12} color={colors.success} />
              <Text style={[styles.badgeText, styles.badgeSuccessText]}>AKTIF</Text>
            </View>
          )}
        </View>

        {/* Governance Data Details */}
        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>NIK Identitas</Text>
            <Text style={styles.detailValue}>{user.nik || 'Belum Terdaftar'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Saldo Dompet</Text>
            <Text style={styles.detailValueHighlighted}>
              Rp {user.balance.toLocaleString('id-ID')}
            </Text>
          </View>
          {user.isSuspended && (
            <View style={styles.suspensionNotice}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
              <Text style={styles.suspensionReasonText}>
                Alasan: {user.suspendReason || 'Ditangguhkan oleh Administrator'}
              </Text>
            </View>
          )}
        </View>

        {/* Action Circuit (Freeze / Unfreeze) */}
        {user.role !== 'admin' && (
          <View style={styles.actionRow}>
            {user.isSuspended ? (
              <TouchableOpacity
                testID={`btn-unfreeze-${user.id}`}
                style={[styles.actionBtn, styles.btnUnfreeze]}
                onPress={() => handleUnfreeze(user)}
                disabled={isFreezing || isUnfreezing}
                activeOpacity={0.7}
              >
                <Ionicons name="lock-open-outline" size={16} color={colors.success} />
                <Text style={styles.btnUnfreezeText}>Buka Blokir</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                testID={`btn-freeze-${user.id}`}
                style={[styles.actionBtn, styles.btnFreeze]}
                onPress={() => handleFreeze(user)}
                disabled={isFreezing || isUnfreezing}
                activeOpacity={0.7}
              >
                <Ionicons name="snow-outline" size={16} color={colors.error} />
                <Text style={styles.btnFreezeText}>Bekukan Akun</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <UserLayout noPadding={false}>
      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="btn-back"
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Manajemen Pengguna</Text>
          <Text style={styles.headerSubtitle}>Direktori & Kontrol Anti-Fraud Akun</Text>
        </View>
      </View>

      {/* Main List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserCard}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
      />

      {/* Initial Loading Overlay */}
      {isLoading && users.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator testID="loading-indicator" size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Memuat data pengguna...</Text>
        </View>
      )}
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  headerSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  filterSection: {
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    height: 46,
    marginVertical: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textMain,
  },
  filterGroup: {
    marginTop: spacing.xs,
  },
  filterLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium as any,
    color: colors.textMuted,
    marginBottom: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.medium as any,
  },
  pillTextActive: {
    color: colors.white,
    fontWeight: typography.weight.bold as any,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
    color: colors.primaryDark,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  username: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  adminBadge: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeText: {
    fontSize: 10,
    fontWeight: typography.weight.bold as any,
    color: colors.primaryDark,
  },
  contactText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: typography.weight.semibold as any,
  },
  badgePremium: {
    backgroundColor: '#FEF3C7',
  },
  badgePremiumText: {
    color: '#B45309',
  },
  badgeBasic: {
    backgroundColor: colors.primaryLight,
  },
  badgeBasicText: {
    color: colors.primaryDark,
  },
  badgeSuccess: {
    backgroundColor: '#D1FAE5',
  },
  badgeSuccessText: {
    color: '#065F46',
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  badgeDangerText: {
    color: colors.error,
  },
  badgeMuted: {
    backgroundColor: '#F3F4F6',
  },
  badgeMutedText: {
    color: colors.textMuted,
  },
  detailsBox: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.sm,
    gap: 4,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: typography.size.xs,
    color: colors.textMain,
    fontWeight: typography.weight.medium as any,
  },
  detailValueHighlighted: {
    fontSize: typography.size.xs,
    color: colors.primaryDark,
    fontWeight: typography.weight.bold as any,
  },
  suspensionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suspensionReasonText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: typography.weight.medium as any,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnFreeze: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  btnFreezeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold as any,
    color: colors.error,
  },
  btnUnfreeze: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  btnUnfreezeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold as any,
    color: '#065F46',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});

export default AdminUserManagementScreen;
