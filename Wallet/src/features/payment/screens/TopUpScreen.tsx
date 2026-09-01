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

const PRESET_AMOUNTS = [20000, 50000, 100000, 200000, 500000, 1000000];

const TopUpScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(50000);
  const [customAmount, setCustomAmount] = useState('');
  const { mutate: initiateTopUp, isPending } = useInitiateTopUpMutation();

  const finalAmount = customAmount
    ? parseInt(customAmount.replace(/[^0-9]/g, ''), 10) || 0
    : selectedAmount || 0;

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomChange = (val: string) => {
    setCustomAmount(val.replace(/[^0-9]/g, ''));
    setSelectedAmount(null);
  };

  const handleTopUp = () => {
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
        <Text style={styles.sectionTitle}>Pilih Nominal Instan</Text>
        <View style={styles.presetGrid}>
          {PRESET_AMOUNTS.map((amt) => {
            const isSelected = selectedAmount === amt;
            return (
              <TouchableOpacity
                key={amt}
                style={[styles.presetCard, isSelected && styles.presetCardActive]}
                onPress={() => handleSelectPreset(amt)}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetText, isSelected && styles.presetTextActive]}>
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
        />

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Pembayaran:</Text>
          <Text style={styles.summaryValue}>Rp {finalAmount.toLocaleString('id-ID')}</Text>
        </View>

        <ButtonCustom
          title="Konfirmasi & Bayar"
          onPress={handleTopUp}
          isLoading={isPending}
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
  presetText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMain,
  },
  presetTextActive: {
    color: colors.primaryDark,
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