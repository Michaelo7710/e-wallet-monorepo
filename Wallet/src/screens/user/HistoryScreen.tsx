import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/id'; // Menggunakan bahasa Indonesia

import UserLayout from '@components/layouts/UserLayout';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';
import { Transaction } from '@type/index';

// Mengatur Day.js agar menggunakan bahasa Indonesia
dayjs.locale('id');

// DATA MOCKUP: Sementara kita hardcode sebelum React Query menyedot data asli dari API
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'topup', amount: 500000, description: 'Top Up via Bank BCA', date: '2026-05-31T09:00:00Z' },
  { id: '2', type: 'transfer_out', amount: 150000, description: 'Transfer ke Budi', date: '2026-05-30T14:20:00Z' },
  { id: '3', type: 'payment', amount: 45000, description: 'Pembayaran PLN', date: '2026-05-29T19:15:00Z' },
  { id: '4', type: 'transfer_in', amount: 200000, description: 'Terima dari Susi', date: '2026-05-28T08:10:00Z' },
];

const HistoryScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  // Komponen Helper untuk memformat Rupiah tanpa library berat
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Komponen Atom: Item Transaksi (Diisolasi agar FlatList berjalan sangat ringan)
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    // Menentukan ikon dan warna berdasarkan tipe transaksi
    const isIncome = item.type === 'topup' || item.type === 'transfer_in';
    const iconName = isIncome ? 'arrow-down' : 'arrow-up';
    const iconColor = isIncome ? colors.success : colors.error;
    const amountPrefix = isIncome ? '+ ' : '- ';

    return (
      <TouchableOpacity style={styles.transactionCard} activeOpacity={0.7}>
        <View style={styles.leftSection}>
          <View style={[styles.iconBox, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={iconName} size={24} color={iconColor} />
          </View>
          <View style={styles.textSection}>
            <Text style={styles.descriptionText} numberOfLines={1}>
              {item.description}
            </Text>
            {/* Format waktu elegan dari MongoDB ke: "31 Mei 2026, 09:00" */}
            <Text style={styles.dateText}>
              {dayjs(item.date).format('D MMMM YYYY, HH:mm')}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={[styles.amountText, { color: iconColor }]}>
            {amountPrefix}{formatCurrency(item.amount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    // Menggunakan Layout Markas Utama
    <UserLayout noPadding={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        <Text style={styles.headerSubtitle}>Pantau mutasi keuangan Anda</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransactionItem}
        // Komponen yang muncul jika data riwayat kosong
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.border} />
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
          </View>
        }
        // Jarak aman untuk area bawah saat di-scroll mentok
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
        showsVerticalScrollIndicator={false}
      />
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  headerSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.radius.lg,
    marginBottom: spacing.md,
    // Bayangan halus untuk kartu transaksi
    shadowColor: colors.textMain,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Agar teks tidak mendorong nominal ke luar layar
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: spacing.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textSection: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  descriptionText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMain,
    marginBottom: 4,
  },
  dateText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.size.md,
    color: colors.textLight,
  },
});

export default HistoryScreen;