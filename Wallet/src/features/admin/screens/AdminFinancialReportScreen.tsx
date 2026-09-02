import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';

import { UserLayout } from '@shared/layouts';
import { colors, typography, spacing } from '@core/theme';
import { useFinancialReport } from '../hooks/useAdminData';

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

const AdminFinancialReportScreen = () => {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<'daily' | 'monthly'>('daily');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  const { data: report, isLoading, refetch, isRefetching } = useFinancialReport(
    filter,
    filter === 'monthly' ? selectedMonth : undefined
  );

  const formatCurrency = (val: number | undefined | null): string => {
    return (val ?? 0).toLocaleString('id-ID');
  };

  const netCashFlow = (report?.inflow ?? 0) - (report?.outflow ?? 0);
  const isSurplus = netCashFlow >= 0;

  return (
    <UserLayout noPadding={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Neraca & Laporan Finansial</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Filter Switcher */}
        <View style={styles.filterSwitcher}>
          <TouchableOpacity
            style={[styles.switchBtn, filter === 'daily' && styles.switchBtnActive]}
            onPress={() => setFilter('daily')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="today-outline"
              size={18}
              color={filter === 'daily' ? colors.white : colors.textMuted}
            />
            <Text style={[styles.switchText, filter === 'daily' && styles.switchTextActive]}>
              Hari Ini (Real-Time)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchBtn, filter === 'monthly' && styles.switchBtnActive]}
            onPress={() => setFilter('monthly')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={18}
              color={filter === 'monthly' ? colors.white : colors.textMuted}
            />
            <Text style={[styles.switchText, filter === 'monthly' && styles.switchTextActive]}>
              Laporan Bulanan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Month Selector Chips */}
        {filter === 'monthly' && (
          <View style={styles.monthSelectorContainer}>
            <Text style={styles.monthSelectorLabel}>Pilih Bulan:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
              {MONTHS.map((m) => {
                const isSelected = selectedMonth === m.value;
                return (
                  <TouchableOpacity
                    key={m.value}
                    style={[styles.monthChip, isSelected && styles.monthChipActive]}
                    onPress={() => setSelectedMonth(m.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.monthChipText, isSelected && styles.monthChipTextActive]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Menghitung agregasi neraca sistem...</Text>
          </View>
        ) : (
          <>
            {/* Card 1: Hero Card - Total Liabilitas Sistem */}
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View style={styles.heroBadge}>
                  <Ionicons name="wallet" size={16} color={colors.primaryDark} />
                  <Text style={styles.heroBadgeText}>Liabilitas Aktif Platform</Text>
                </View>
              </View>
              <Text style={styles.heroLabel}>Total Uang Beredar di Sistem</Text>
              <Text style={styles.heroAmount}>
                Rp {formatCurrency(report?.totalMoneyInSystem)}
              </Text>
              <Text style={styles.heroSubtext}>
                Akumulasi saldo aktif seluruh dompet pengguna yang beredar.
              </Text>
            </View>

            {/* Grid Inflow vs Outflow */}
            <View style={styles.gridContainer}>
              {/* Card Inflow */}
              <View style={[styles.gridCard, { borderLeftColor: colors.success }]}>
                <View style={styles.gridCardHeader}>
                  <View style={[styles.gridIconBox, { backgroundColor: `${colors.success}15` }]}>
                    <Ionicons name="arrow-down" size={18} color={colors.success} />
                  </View>
                  <Text style={styles.gridCardLabel}>Uang Masuk (Inflow)</Text>
                </View>
                <Text style={[styles.gridAmount, { color: colors.success }]}>
                  + Rp {formatCurrency(report?.inflow)}
                </Text>
                <Text style={styles.gridSubtext}>Akumulasi Top Up berhasil</Text>
              </View>

              {/* Card Outflow */}
              <View style={[styles.gridCard, { borderLeftColor: colors.error }]}>
                <View style={styles.gridCardHeader}>
                  <View style={[styles.gridIconBox, { backgroundColor: `${colors.error}15` }]}>
                    <Ionicons name="arrow-up" size={18} color={colors.error} />
                  </View>
                  <Text style={styles.gridCardLabel}>Uang Keluar (Outflow)</Text>
                </View>
                <Text style={[styles.gridAmount, { color: colors.error }]}>
                  - Rp {formatCurrency(report?.outflow)}
                </Text>
                <Text style={styles.gridSubtext}>Akumulasi Penarikan dana</Text>
              </View>
            </View>

            {/* Card Net Cash Flow */}
            <View
              style={[
                styles.netCard,
                { borderLeftColor: isSurplus ? colors.success : colors.error },
              ]}
            >
              <View style={styles.netCardHeader}>
                <View style={styles.netTitleGroup}>
                  <Ionicons
                    name={isSurplus ? 'trending-up-outline' : 'trending-down-outline'}
                    size={22}
                    color={isSurplus ? colors.success : colors.error}
                  />
                  <Text style={styles.netCardTitle}>Arus Kas Bersih (Net Cash Flow)</Text>
                </View>
                <View
                  style={[
                    styles.statusTag,
                    { backgroundColor: isSurplus ? `${colors.success}15` : `${colors.error}15` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTagText,
                      { color: isSurplus ? colors.success : colors.error },
                    ]}
                  >
                    {isSurplus ? 'SURPLUS' : 'DEFISIT'}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.netAmount,
                  { color: isSurplus ? colors.success : colors.error },
                ]}
              >
                {isSurplus ? '+' : '-'} Rp {formatCurrency(Math.abs(netCashFlow))}
              </Text>
              <Text style={styles.netSubtext}>
                {isSurplus
                  ? 'Likuiditas sistem mengalami surplus pada periode yang dipilih.'
                  : 'Likuiditas sistem mengalami defisit penarikan dana pada periode ini.'}
              </Text>
            </View>

            {/* Audit Trail Metadata Box */}
            <View style={styles.metadataBox}>
              <View style={styles.metadataHeader}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                <Text style={styles.metadataTitle}>Jejak Audit Laporan</Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Tipe Filter:</Text>
                <Text style={styles.metadataValue}>
                  {report?.meta?.filterApplied === 'daily'
                    ? 'Harian (Real-Time)'
                    : `Bulanan (${MONTHS.find((m) => m.value === selectedMonth)?.label || 'Bulan Terpilih'})`}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Periode Mulai:</Text>
                <Text style={styles.metadataValue}>
                  {report?.meta?.rangeStart
                    ? dayjs(report.meta.rangeStart).format('DD MMMM YYYY, HH:mm')
                    : '-'}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>Periode Selesai:</Text>
                <Text style={styles.metadataValue}>
                  {report?.meta?.rangeEnd
                    ? dayjs(report.meta.rangeEnd).format('DD MMMM YYYY, HH:mm')
                    : '-'}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  container: {
    paddingBottom: spacing.xxxl,
  },
  filterSwitcher: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: spacing.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: spacing.radius.sm,
    gap: 6,
  },
  switchBtnActive: {
    backgroundColor: colors.primary,
  },
  switchText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMuted,
  },
  switchTextActive: {
    color: colors.white,
  },
  monthSelectorContainer: {
    marginBottom: spacing.md,
  },
  monthSelectorLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.semibold as any,
    marginBottom: spacing.xs,
  },
  monthScroll: {
    flexDirection: 'row',
  },
  monthChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.xs,
  },
  monthChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  monthChipText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  monthChipTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.weight.bold as any,
  },
  centerContainer: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  heroCard: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: spacing.radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primaryDark}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: spacing.radius.sm,
    gap: 4,
  },
  heroBadgeText: {
    fontSize: typography.size.xs,
    color: colors.primaryDark,
    fontWeight: typography.weight.bold as any,
  },
  heroLabel: {
    fontSize: typography.size.xs,
    color: colors.primaryDark,
    fontWeight: typography.weight.medium as any,
    marginTop: spacing.xs,
  },
  heroAmount: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold as any,
    color: colors.primaryDark,
    marginVertical: 4,
  },
  heroSubtext: {
    fontSize: typography.size.xs,
    color: colors.primaryDark,
    opacity: 0.85,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  gridCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.radius.md,
    borderLeftWidth: 4,
    elevation: 2,
  },
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  gridIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    fontWeight: typography.weight.semibold as any,
    flex: 1,
  },
  gridAmount: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
    marginTop: 4,
  },
  gridSubtext: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  netCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.radius.lg,
    borderLeftWidth: 4,
    marginBottom: spacing.md,
    elevation: 2,
  },
  netCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  netTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  netCardTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  statusTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.radius.sm,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: typography.weight.bold as any,
  },
  netAmount: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold as any,
    marginTop: 4,
  },
  netSubtext: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  metadataBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metadataHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  metadataTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  metadataLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  metadataValue: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium as any,
    color: colors.textMain,
  },
});

export default AdminFinancialReportScreen;
