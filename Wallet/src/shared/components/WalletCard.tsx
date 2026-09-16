import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@core/theme';
import { User } from '@domain/entities/user';

export const getWalletTierInfo = (user: User | null) => {
  const isPremium = user?.accountTier === 'premium' || Boolean(user?.isKycVerified);
  return {
    tierName: isPremium ? 'Akun Premium' : 'Akun Basic',
    maxLimit: isPremium ? 50000000 : 5000000,
    formattedLimit: isPremium ? 'Rp 50.000.000' : 'Rp 5.000.000',
    isPremium,
  };
};

export interface WalletCardProps {
  balance: number;
  userName: string;
  user?: User | null;
}

const WalletCard = ({ balance, userName, user }: WalletCardProps) => {
  const tierInfo = getWalletTierInfo(user ?? null);
  const formattedBalance = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(balance);

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardContainer}
    >
      <View style={styles.header}>
        <View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Total Saldo</Text>
            <View
              style={[
                styles.tierBadge,
                tierInfo.isPremium ? styles.tierBadgePremium : styles.tierBadgeBasic,
              ]}
            >
              <Text style={styles.tierBadgeText}>{tierInfo.tierName}</Text>
            </View>
          </View>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <Ionicons name="wallet" size={40} color={colors.white} style={styles.iconOp} />
      </View>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceText}>{formattedBalance}</Text>
        <View style={styles.limitRow}>
          <Ionicons
            name={tierInfo.isPremium ? 'shield-checkmark' : 'information-circle-outline'}
            size={14}
            color={colors.primaryLight}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.limitText}>
            Batas Maksimal: {tierInfo.formattedLimit}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    minHeight: 185,
    borderRadius: spacing.radius.lg,
    padding: spacing.xl,
    justifyContent: 'space-between',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: spacing.radius.md,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: colors.primaryLight,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium as any,
  },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.radius.full,
    marginLeft: spacing.sm,
  },
  tierBadgePremium: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tierBadgeBasic: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  tierBadgeText: {
    color: colors.white,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold as any,
  },
  userName: {
    color: colors.white,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold as any,
    marginTop: 4,
  },
  iconOp: {
    opacity: 0.5,
  },
  balanceContainer: {
    marginTop: 'auto',
    paddingTop: spacing.sm,
  },
  balanceText: {
    color: colors.white,
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold as any,
    letterSpacing: 1,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  limitText: {
    color: colors.primaryLight,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium as any,
  },
});

export default WalletCard;