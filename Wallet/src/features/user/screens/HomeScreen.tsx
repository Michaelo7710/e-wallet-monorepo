import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserLayout } from '@shared/layouts';
import { WalletCard } from '@shared/components';
import { getGreetingTime } from '@shared/utils';
import { colors, typography, spacing } from '@core/theme';
import { useUserProfile } from '../hooks/useUserData';
import { useFeatureFlagStore } from '@core/config/featureFlags';
import defaultAvatar from '@assets/images/avatar-default.png';

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { data: user, refetch, isRefetching } = useUserProfile();
  const currentBalance = user?.balance ?? 0;

  // Feature Flag State & Degradation Notices
  const isTransferEnabled = useFeatureFlagStore(
    (state) => state.flags.p2p_transfer?.enabled ?? true
  );
  const isTopUpEnabled = useFeatureFlagStore(
    (state) => state.flags.topup_midtrans?.enabled ?? true
  );
  const isWithdrawEnabled = useFeatureFlagStore(
    (state) => state.flags.bank_withdrawal?.enabled ?? true
  );

  const transferNotice =
    useFeatureFlagStore((state) => state.flags.p2p_transfer?.maintenanceMessage) ||
    'Layanan transfer dana P2P sedang dalam pemeliharaan berkala. Silakan coba beberapa saat lagi.';
  const topUpNotice =
    useFeatureFlagStore((state) => state.flags.topup_midtrans?.maintenanceMessage) ||
    'Layanan top up saldo sedang dalam pemeliharaan berkala. Silakan coba beberapa saat lagi.';
  const withdrawNotice =
    useFeatureFlagStore((state) => state.flags.bank_withdrawal?.maintenanceMessage) ||
    'Layanan tarik tunai / transfer bank sedang dalam pemeliharaan berkala. Silakan coba beberapa saat lagi.';

  const fetchRemoteFlags = useFeatureFlagStore((state) => state.fetchRemoteFlags);

  useEffect(() => {
    fetchRemoteFlags();
  }, [fetchRemoteFlags]);

  const onRefresh = async () => {
    await Promise.all([refetch(), fetchRemoteFlags(true)]);
  };

  return (
    <UserLayout noPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.headerContainer}>
          <View style={styles.greetingWrapper}>
            <Image
              source={user?.avatar ? { uri: user.avatar } : defaultAvatar}
              style={styles.avatar}
              contentFit="cover"
              transition={300}
            />
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greetingTime}>{getGreetingTime()},</Text>
              <Text style={styles.userName}>{user?.username || 'Pengguna'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={24} color={colors.textMain} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContainer}>
          <WalletCard
            balance={currentBalance}
            userName={user?.username || 'E-Wallet User'}
          />
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          <View style={styles.actionGrid}>
            <ActionMenu
              icon="arrow-up"
              label="Transfer"
              color={colors.info}
              disabled={!isTransferEnabled}
              badgeText="Perbaikan"
              onPress={() => {
                if (!isTransferEnabled) {
                  Alert.alert('Fitur Sedang Pemeliharaan', transferNotice);
                  return;
                }
                navigation.navigate('Transfer');
              }}
            />
            <ActionMenu
              icon="add"
              label="Top Up"
              color={colors.success}
              disabled={!isTopUpEnabled}
              badgeText="Perbaikan"
              onPress={() => {
                if (!isTopUpEnabled) {
                  Alert.alert('Fitur Sedang Pemeliharaan', topUpNotice);
                  return;
                }
                navigation.navigate('TopUp');
              }}
            />
            <ActionMenu
              icon="card-outline"
              label="Tarik Tunai"
              color={colors.warning}
              disabled={!isWithdrawEnabled}
              badgeText="Perbaikan"
              onPress={() => {
                if (!isWithdrawEnabled) {
                  Alert.alert('Fitur Sedang Pemeliharaan', withdrawNotice);
                  return;
                }
                navigation.navigate('Withdraw');
              }}
            />
            <ActionMenu
              icon="grid-outline"
              label="Lainnya"
              color={colors.primary}
              onPress={() => navigation.navigate('Riwayat')}
            />
          </View>
        </View>
      </ScrollView>
    </UserLayout>
  );
};

const ActionMenu = ({
  icon,
  label,
  color,
  onPress,
  disabled = false,
  badgeText,
}: {
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
  badgeText?: string;
}) => (
  <TouchableOpacity
    style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
    activeOpacity={disabled ? 0.8 : 0.7}
    onPress={onPress}
    accessible={true}
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ disabled }}
    accessibilityHint={disabled ? 'Fitur sedang dalam pemeliharaan operasional' : undefined}
  >
    <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={28} color={color} />
      {disabled && (
        <View style={styles.actionBadge}>
          <Text style={styles.actionBadgeText}>{badgeText || 'Perbaikan'}</Text>
        </View>
      )}
    </View>
    <Text style={[styles.actionLabel, disabled && styles.actionLabelDisabled]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  greetingWrapper: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: spacing.radius.full,
    backgroundColor: colors.border,
  },
  greetingTextContainer: { marginLeft: spacing.md },
  greetingTime: { fontSize: typography.size.sm, color: colors.textMuted },
  userName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  notificationBtn: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1,
    borderColor: colors.white,
  },
  cardContainer: { marginBottom: spacing.xxl },
  quickActionsContainer: { flex: 1 },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMain,
    marginBottom: spacing.md,
  },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  actionButton: { alignItems: 'center', width: '22%' },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: spacing.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.warning,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: spacing.radius.full,
  },
  actionBadgeText: {
    fontSize: 9,
    fontWeight: typography.weight.bold as any,
    color: colors.white,
  },
  actionLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: typography.weight.medium as any,
  },
  actionLabelDisabled: {
    color: colors.textLight,
  },
});

export default HomeScreen;