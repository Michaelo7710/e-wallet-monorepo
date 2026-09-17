import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@core/theme';
import { User } from '@domain/entities/user';
import cardBg from '@assets/images/card-texture-platinum.png';

export const getWalletTierInfo = (user: User | null) => {
  const isPremium = user?.accountTier === 'premium' || Boolean(user?.isKycVerified);
  return {
    tierName: isPremium ? 'PLATINUM KYC' : 'REGULER TIER',
    maxLimit: isPremium ? 20000000 : 2000000,
    formattedLimit: isPremium ? 'Rp 20.000.000' : 'Rp 2.000.000',
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
    <View style={styles.outerShadowWrapper}>
      <ImageBackground
        source={cardBg}
        style={styles.cardContainer}
        imageStyle={styles.cardImageStyle}
      >
        <LinearGradient
          colors={[
            'rgba(6, 78, 59, 0.7)',
            'rgba(4, 120, 87, 0.8)',
            'rgba(2, 44, 34, 0.92)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardOverlay}
        >
          {/* Header Row: Label, Tier Badge, Brand Logo */}
          <View style={styles.header}>
            <View>
              <View style={styles.labelRow}>
                <Text style={styles.label}>GREENPAY VIRTUAL</Text>
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
            <Ionicons name="card" size={32} color="rgba(255, 255, 255, 0.85)" />
          </View>

          {/* Virtual EMV Chip & Contactless */}
          <View style={styles.chipRow}>
            <LinearGradient
              colors={['#F59E0B', '#D97706', '#92400E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emvChip}
            >
              <View style={styles.chipInnerGrid} />
            </LinearGradient>
            <Ionicons
              name="wifi-outline"
              size={18}
              color="rgba(255, 255, 255, 0.6)"
              style={styles.contactlessIcon}
            />
          </View>

          {/* Bottom Row: Balance and Limit */}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Saldo Aktif</Text>
            <Text style={styles.balanceText}>{formattedBalance}</Text>
            <View style={styles.limitRow}>
              <Ionicons
                name={tierInfo.isPremium ? 'shield-checkmark' : 'information-circle-outline'}
                size={14}
                color={colors.primaryLight}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.limitText}>
                Limit Bulanan: {tierInfo.formattedLimit}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  outerShadowWrapper: {
    width: '100%',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    borderRadius: spacing.radius.lg,
  },
  cardContainer: {
    width: '100%',
    minHeight: 195,
    borderRadius: spacing.radius.lg,
    overflow: 'hidden',
  },
  cardImageStyle: {
    borderRadius: spacing.radius.lg,
  },
  cardOverlay: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'space-between',
    borderRadius: spacing.radius.lg,
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
    color: 'rgba(209, 250, 229, 0.9)',
    fontSize: typography.size.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: spacing.radius.full,
    marginLeft: spacing.sm,
  },
  tierBadgePremium: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderColor: '#34D399',
  },
  tierBadgeBasic: {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  tierBadgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userName: {
    color: colors.white,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold as any,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 12,
  },
  emvChip: {
    width: 36,
    height: 26,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipInnerGrid: {
    width: 20,
    height: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 2,
  },
  contactlessIcon: {
    transform: [{ rotate: '90deg' }],
  },
  balanceContainer: {
    marginTop: 'auto',
    paddingTop: 4,
  },
  balanceLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  balanceText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  limitText: {
    color: colors.primaryLight,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium as any,
  },
});

export default WalletCard;