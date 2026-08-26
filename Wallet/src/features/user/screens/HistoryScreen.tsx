// import React, { useState } from 'react';
// import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import dayjs from 'dayjs';
// import 'dayjs/locale/id';

// import { UserLayout } from '@shared/layouts';
// import { colors, typography, spacing } from '@core/theme';
// import { Transaction } from '@type/index';

// dayjs.locale('id');

// const MOCK_TRANSACTIONS: Transaction[] = [
//   { id: '1', type: 'topup', amount: 500000, description: 'Top Up via Bank BCA', date: '2026-05-31T09:00:00Z' },
//   { id: '2', type: 'transfer_out', amount: 150000, description: 'Transfer ke Budi', date: '2026-05-30T14:20:00Z' },
//   { id: '3', type: 'payment', amount: 45000, description: 'Pembayaran PLN', date: '2026-05-29T19:15:00Z' },
//   { id: '4', type: 'transfer_in', amount: 200000, description: 'Terima dari Susi', date: '2026-05-28T08:10:00Z' },
// ];

// const HistoryScreen = () => {
//   const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('id-ID', {
//       style: 'currency',
//       currency: 'IDR',
//       minimumFractionDigits: 0,
//     }).format(amount);
//   };

//   const renderTransactionItem = ({ item }: { item: Transaction }) => {
//     const isIncome = item.type === 'topup' || item.type === 'transfer_in';
//     const iconName = isIncome ? 'arrow-down' : 'arrow-up';
//     const iconColor = isIncome ? colors.success : colors.error;
//     const amountPrefix = isIncome ? '+ ' : '- ';

//     return (
//       <TouchableOpacity style={styles.transactionCard} activeOpacity={0.7}>
//         <View style={styles.leftSection}>
//           <View style={[styles.iconBox, { backgroundColor: `${iconColor}15` }]}>
//             <Ionicons name={iconName} size={24} color={iconColor} />
//           </View>
//           <View style={styles.textSection}>
//             <Text style={styles.descriptionText} numberOfLines={1}>
//               {item.description}
//             </Text>
//             <Text style={styles.dateText}>
//               {dayjs(item.date).format('D MMMM YYYY, HH:mm')}
//             </Text>
//           </View>
//         </View>
//         <View style={styles.rightSection}>
//           <Text style={[styles.amountText, { color: iconColor }]}>
//             {amountPrefix}{formatCurrency(item.amount)}
//           </Text>
//         </View>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <UserLayout noPadding={false}>
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
//         <Text style={styles.headerSubtitle}>Pantau mutasi keuangan Anda</Text>
//       </View>
//       <FlatList
//         data={transactions}
//         keyExtractor={(item) => item.id}
//         renderItem={renderTransactionItem}
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Ionicons name="receipt-outline" size={64} color={colors.border} />
//             <Text style={styles.emptyText}>Belum ada transaksi</Text>
//           </View>
//         }
//         contentContainerStyle={{ paddingBottom: spacing.xxxl }}
//         showsVerticalScrollIndicator={false}
//       />
//     </UserLayout>
//   );
// };

// const styles = StyleSheet.create({
//   header: {
//     marginTop: spacing.md,
//     marginBottom: spacing.lg,
//   },
//   headerTitle: {
//     fontSize: typography.size.xxl,
//     fontWeight: typography.weight.bold as any,
//     color: colors.textMain,
//   },
//   headerSubtitle: {
//     fontSize: typography.size.sm,
//     color: colors.textMuted,
//     marginTop: spacing.xs,
//   },
//   transactionCard: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: colors.surface,
//     padding: spacing.md,
//     borderRadius: spacing.radius.lg,
//     marginBottom: spacing.md,
//     shadowColor: colors.textMain,
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   leftSection: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   iconBox: {
//     width: 48,
//     height: 48,
//     borderRadius: spacing.radius.md,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: spacing.md,
//   },
//   textSection: {
//     flex: 1,
//     paddingRight: spacing.sm,
//   },
//   descriptionText: {
//     fontSize: typography.size.md,
//     fontWeight: typography.weight.semibold as any,
//     color: colors.textMain,
//     marginBottom: 4,
//   },
//   dateText: {
//     fontSize: typography.size.xs,
//     color: colors.textMuted,
//   },
//   rightSection: {
//     alignItems: 'flex-end',
//   },
//   amountText: {
//     fontSize: typography.size.md,
//     fontWeight: typography.weight.bold as any,
//   },
//   emptyContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingTop: 100,
//   },
//   emptyText: {
//     marginTop: spacing.md,
//     fontSize: typography.size.md,
//     color: colors.textLight,
//   },
// });

// export default HistoryScreen;

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { UserLayout } from '@shared/layouts';
import { colors, typography, spacing } from '@core/theme';
import { Transaction } from '@domain/entities/transaction';
import { useTransactionHistory } from '../hooks/useUserData';

dayjs.locale('id');

const HistoryScreen = () => {
  const [page] = useState(1);
  const { data, isLoading, refetch, isRefetching } = useTransactionHistory(page);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.flow === 'in';
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
              {item.description || item.type.toUpperCase()}
            </Text>
            <Text style={styles.dateText}>
              {dayjs(item.createdAt).format('D MMMM YYYY, HH:mm')}
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
    <UserLayout noPadding={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        <Text style={styles.headerSubtitle}>Pantau mutasi keuangan Anda</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.transactions ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={colors.border} />
              <Text style={styles.emptyText}>Belum ada transaksi</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: spacing.xxxl }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  header: { marginTop: spacing.md, marginBottom: spacing.lg },
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.radius.lg,
    marginBottom: spacing.md,
    shadowColor: colors.textMain,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: spacing.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  textSection: { flex: 1, paddingRight: spacing.sm },
  descriptionText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMain,
    marginBottom: 4,
  },
  dateText: { fontSize: typography.size.xs, color: colors.textMuted },
  rightSection: { alignItems: 'flex-end' },
  amountText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { marginTop: spacing.md, fontSize: typography.size.md, color: colors.textLight },
});

export default HistoryScreen;