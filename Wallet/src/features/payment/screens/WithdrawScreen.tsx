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
import { useAuthStore } from '@core/storage/useAuthStore';
import { useWithdrawalMutation } from '../hooks/usePaymentMutations';

const POPULAR_BANKS = ['BCA', 'BRI', 'Mandiri', 'BNI', 'CIMB Niaga'];

const WithdrawScreen = () => {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const currentBalance = user?.balance ?? 0;
  const { mutate: requestWithdrawal, isPending } = useWithdrawalMutation();

  const [selectedBank, setSelectedBank] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');

  const numericAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;

  const handleWithdraw = () => {
    if (!accountNumber || accountNumber.length < 6) {
      Alert.alert('Data Tidak Lengkap', 'Nomor rekening wajib diisi dengan benar.');
      return;
    }
    if (!accountName || accountName.length < 3) {
      Alert.alert('Data Tidak Lengkap', 'Nama pemilik rekening wajib diisi.');
      return;
    }
    if (numericAmount < 50000) {
      Alert.alert('Nominal Minimal', 'Penarikan saldo minimal Rp 50.000.');
      return;
    }
    if (numericAmount > currentBalance) {
      Alert.alert('Saldo Tidak Cukup', 'Saldo Anda tidak mencukupi untuk melakukan penarikan ini.');
      return;
    }

    requestWithdrawal(
      {
        bankName: selectedBank,
        accountNumber,
        accountName,
        amount: numericAmount,
      },
      {
        onSuccess: () => {
          if (numericAmount >= 10000000) {
            Alert.alert(
              'Pengajuan Penarikan Tertahan',
              `Pengajuan penarikan dana bernilai besar sebesar Rp ${numericAmount.toLocaleString('id-ID')} sedang menunggu verifikasi kepatuhan oleh Administrator.`,
              [{ text: 'Kembali', onPress: () => navigation.goBack() }]
            );
          } else {
            Alert.alert(
              'Penarikan Berhasil Diproses',
              `Penarikan dana sebesar Rp ${numericAmount.toLocaleString('id-ID')} ke ${selectedBank} (${accountNumber}) a.n ${accountName} berhasil diproses instan.`,
              [{ text: 'Kembali', onPress: () => navigation.goBack() }]
            );
          }
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Penarikan gagal';
          Alert.alert('Gagal Penarikan', msg);
        },
      }
    );
  };

  return (
    <UserLayout noPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tarik Tunai / Transfer Bank</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <View style={styles.balanceInfoBox}>
          <Text style={styles.balanceLabel}>Saldo Dapat Ditarik</Text>
          <Text style={styles.balanceValue}>Rp {currentBalance.toLocaleString('id-ID')}</Text>
        </View>

        <Text style={styles.sectionTitle}>Pilih Bank Tujuan</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankChipsContainer}>
          {POPULAR_BANKS.map((bank) => {
            const isSelected = selectedBank === bank;
            return (
              <TouchableOpacity
                key={bank}
                style={[styles.bankChip, isSelected && styles.bankChipActive]}
                onPress={() => setSelectedBank(bank)}
                activeOpacity={0.7}
              >
                <Text style={[styles.bankChipText, isSelected && styles.bankChipTextActive]}>
                  {bank}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <InputField
          label="Nomor Rekening Bank"
          placeholder="Contoh: 1234567890"
          keyboardType="numeric"
          value={accountNumber}
          onChangeText={setAccountNumber}
        />

        <InputField
          label="Nama Pemilik Rekening"
          placeholder="Sesuai buku tabungan"
          autoCapitalize="characters"
          value={accountName}
          onChangeText={setAccountName}
        />

        <InputField
          label="Nominal Penarikan (Rp)"
          placeholder="Min. Rp 50.000"
          keyboardType="numeric"
          value={amount}
          onChangeText={(val) => setAmount(val.replace(/[^0-9]/g, ''))}
        />

        <ButtonCustom
          title="Ajukan Penarikan"
          onPress={handleWithdraw}
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
  balanceInfoBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: spacing.radius.md,
    marginBottom: spacing.lg,
  },
  balanceLabel: {
    fontSize: typography.size.xs,
    color: colors.primaryDark,
    fontWeight: typography.weight.medium as any,
  },
  balanceValue: {
    fontSize: typography.size.lg,
    color: colors.primaryDark,
    fontWeight: typography.weight.bold as any,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    color: colors.textMain,
    fontWeight: typography.weight.semibold as any,
    marginBottom: spacing.sm,
  },
  bankChipsContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  bankChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  bankChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  bankChipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium as any,
    color: colors.textMain,
  },
  bankChipTextActive: {
    color: colors.primaryDark,
    fontWeight: typography.weight.bold as any,
  },
  submitBtn: {
    marginTop: spacing.xl,
  },
});

export default WithdrawScreen;