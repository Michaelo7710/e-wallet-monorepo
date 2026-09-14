import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { UserLayout } from '@shared/layouts';
import { InputField, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useInitiateTopUpMutation } from '../hooks/usePaymentMutations';
import { useFeatureFlagStore } from '@core/config/featureFlags';

const PRESET_AMOUNTS = [20000, 50000, 100000, 200000, 500000, 1000000];

const TopUpScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50000);
  const [customAmount, setCustomAmount] = useState('');
  const { mutate: initiateTopUp, isPending } = useInitiateTopUpMutation();

  const isTopUpEnabled = useFeatureFlagStore(
    (state) => state.flags.topup_midtrans?.enabled ?? true
  );
  const topUpNotice =
    useFeatureFlagStore((state) => state.flags.topup_midtrans?.maintenanceMessage) ||
    'Layanan Ini Sedang Dalam Pemeliharaan Berkala. Untuk sementara waktu mutasi ini ditangguhkan demi keamanan dana Anda.';

  const finalAmount = customAmount
    ? parseInt(customAmount.replace(/[^0-9]/g, ''), 10) || 0
    : selectedAmount || 0;

  const handleSelectPreset = (amount: number) => {
    if (!isTopUpEnabled) return;
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomChange = (val: string) => {
    setCustomAmount(val.replace(/[^0-9]/g, ''));
    setSelectedAmount(null);
  };

  const handleTopUp = () => {
    // Graceful Degradation Guard: Blokir eksekusi mutasi jika fitur dinonaktifkan
    if (!isTopUpEnabled) {
      Alert.alert('Fitur Sedang Pemeliharaan', topUpNotice);
      return;
    }

    if (finalAmount < 10000) {
      Alert.alert('Nominal Tidak Valid', 'Top Up saldo minimal Rp 10.000.');
      return;
    }

    initiateTopUp(finalAmount, {
      onSuccess: (data) => {
        navigation.navigate('SnapPaymentWebView', {
          redirectUrl: data.redirectUrl,
          referenceId: data.referenceId,
          amount: finalAmount,
        });
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Gagal memproses top up';
        Alert.alert('Gagal Top Up', msg);
      },
    });
  };

  return (
    <UserLayout noPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Up Saldo</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        {/* Graceful Degradation Banner */}
        {!isTopUpEnabled && (
          <View
            style={styles.degradationBanner}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel={topUpNotice}
          >
            <Ionicons name="warning-outline" size={20} color={colors.warning} />
            <Text style={styles.degradationBannerText}>{topUpNotice}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Pilih Nominal Instan</Text>
        <View style={styles.presetGrid}>
          {PRESET_AMOUNTS.map((amt) => {
            const isSelected = selectedAmount === amt;
            return (
              <TouchableOpacity
                key={amt}
                style={[
                  styles.presetCard,
                  isSelected && styles.presetCardActive,
                  !isTopUpEnabled && styles.presetCardDisabled,
                ]}
                onPress={() => handleSelectPreset(amt)}
                activeOpacity={0.7}
                disabled={!isTopUpEnabled}
              >
                <Text
                  style={[
                    styles.presetText,
                    isSelected && styles.presetTextActive,
                    !isTopUpEnabled && styles.presetTextDisabled,
                  ]}
                >
                  Rp {amt.toLocaleString('id-ID')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <InputField
          label="Atau Masukkan Nominal Khusus"
          placeholder="Contoh: 75000"
          keyboardType="numeric"
          value={customAmount}
          onChangeText={handleCustomChange}
          editable={isTopUpEnabled}
        />

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Pembayaran:</Text>
          <Text style={styles.summaryValue}>Rp {finalAmount.toLocaleString('id-ID')}</Text>
        </View>

        <ButtonCustom
          title="Konfirmasi & Bayar"
          onPress={handleTopUp}
          isLoading={isPending}
          disabled={!isTopUpEnabled}
          style={styles.submitBtn}
        />
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
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  contentContainer: {
    paddingBottom: spacing.xxxl,
  },
  degradationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}18`,
    borderColor: `${colors.warning}50`,
    borderWidth: 1,
    padding: spacing.md,
    borderRadius: spacing.radius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  degradationBannerText: {
    flex: 1,
    fontSize: typography.size.xs,
    color: colors.textMain,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    color: colors.textMain,
    fontWeight: typography.weight.semibold as any,
    marginBottom: spacing.md,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  presetCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: spacing.radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  presetCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  presetCardDisabled: {
    opacity: 0.5,
  },
  presetText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMain,
  },
  presetTextActive: {
    color: colors.primaryDark,
  },
  presetTextDisabled: {
    color: colors.textLight,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  summaryValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold as any,
    color: colors.primary,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});

export default TopUpScreen;