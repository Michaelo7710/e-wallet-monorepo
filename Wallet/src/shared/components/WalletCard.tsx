import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@core/theme';

interface WalletCardProps {
  balance: number;
  userName: string;
}

const WalletCard = ({ balance, userName }: WalletCardProps) => {
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
          <Text style={styles.label}>Total Saldo</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <Ionicons name="wallet" size={40} color={colors.white} style={styles.iconOp} />
      </View>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceText}>{formattedBalance}</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: 180,
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
  label: {
    color: colors.primaryLight,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium as any,
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
  },
  balanceText: {
    color: colors.white,
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold as any,
    letterSpacing: 1,
  },
});

export default WalletCard;