import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '../theme/spacing';

// Kontrak Data untuk Kartu Dompet
interface WalletCardProps {
  balance: number;
  userName: string;
}

const WalletCard = ({ balance, userName }: WalletCardProps) => {
  
  // Format angka ke Rupiah dengan standar Intl bawaan JavaScript (Efisien tanpa library tambahan)
  const formattedBalance = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(balance);

  return (
    <LinearGradient
      // Menggunakan gradasi dari Emerald Utama ke Emerald Gelap
      colors={[colors.primary, colors.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardContainer}
    >
      {/* Bagian Atas Kartu (Header) */}
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Total Saldo</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        {/* Ikon Dompet sebagai hiasan air (watermark) */}
        <Ionicons name="wallet" size={40} color={colors.white} style={styles.iconOp} />
      </View>

      {/* Bagian Bawah Kartu (Nominal Utama) */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceText}>{formattedBalance}</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: 180, // Proporsi rasio yang mirip dengan kartu debit/kredit fisik
    borderRadius: spacing.radius.lg,
    padding: spacing.xl,
    justifyContent: 'space-between',
    // Efek Shadow agar kartu terlihat melayang (3D) dari background
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: spacing.radius.md,
    elevation: 8, // Khusus untuk bayangan di Android
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
    opacity: 0.5, // Dibuat semi-transparan agar terlihat elegan
  },
  balanceContainer: {
    marginTop: 'auto', // Mendorong teks ke paling bawah kartu
  },
  balanceText: {
    color: colors.white,
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold as any,
    letterSpacing: 1, // Memberi ruang antar angka agar mudah dibaca
  },
});

export default WalletCard;