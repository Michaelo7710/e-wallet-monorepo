import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { UserLayout } from '@shared/layouts';
import { InputField, ButtonCustom, PinModal } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useAuthStore } from '@core/storage/useAuthStore';
import { useTransferMutation, useRecentContacts } from '../hooks/usePaymentMutations';
import defaultAvatar from '@assets/images/avatar-default.png';

const TransferScreen = () => {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const { data: contacts } = useRecentContacts();
  const { mutate: transfer, isPending } = useTransferMutation();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isPinVisible, setIsPinVisible] = useState(false);

  const numericAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10) || 0;
  const currentBalance = user?.balance ?? 0;

  const handleOpenPin = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Data Tidak Lengkap', 'Nomor handphone tujuan minimal 10 digit.');
      return;
    }
    if (numericAmount < 10000) {
      Alert.alert('Nominal Minimal', 'Nominal transfer minimal Rp 10.000.');
      return;
    }
    if (numericAmount > currentBalance) {
      Alert.alert('Saldo Tidak Cukup', 'Saldo dompet Anda tidak mencukupi untuk nominal transfer ini.');
      return;
    }
    setIsPinVisible(true);
  };

  const handleConfirmPin = (pin: string) => {
    transfer(
      {
        receiverPhoneNumber: phoneNumber,
        amount: numericAmount,
        pin,
      },
      {
        onSuccess: (tx) => {
          setIsPinVisible(false);
          Alert.alert(
            'Transfer Berhasil',
            `Berhasil transfer Rp ${numericAmount.toLocaleString('id-ID')} ke ${phoneNumber}.\nRef: ${tx.referenceId}`,
            [{ text: 'Selesai', onPress: () => navigation.goBack() }]
          );
        },
        onError: (err: any) => {
          setIsPinVisible(false);
          const msg = err.response?.data?.message || err.message || 'Transfer gagal diproses';
          Alert.alert('Transfer Gagal', msg);
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
        <Text style={styles.headerTitle}>Transfer Saldo</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <View style={styles.balanceInfoBox}>
          <Text style={styles.balanceLabel}>Saldo Aktif</Text>
          <Text style={styles.balanceValue}>Rp {currentBalance.toLocaleString('id-ID')}</Text>
        </View>

        {contacts && contacts.length > 0 && (
          <View style={styles.contactSection}>
            <Text style={styles.sectionLabel}>Kontak Terakhir</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactList}>
              {contacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={styles.contactItem}
                  onPress={() => setPhoneNumber(contact.phoneNumber)}
                >
                  <Image
                    source={contact.avatar ? { uri: contact.avatar } : defaultAvatar}
                    style={styles.contactAvatar}
                  />
                  <Text style={styles.contactName} numberOfLines={1}>
                    {contact.username}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <InputField
          label="Nomor Handphone Tujuan"
          placeholder="Contoh: 08123456789"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        <InputField
          label="Nominal Transfer (Rp)"
          placeholder="Min. Rp 10.000"
          keyboardType="numeric"
          value={amount}
          onChangeText={(val) => setAmount(val.replace(/[^0-9]/g, ''))}
        />

        <ButtonCustom
          title="Lanjutkan Transfer"
          onPress={handleOpenPin}
          style={styles.submitBtn}
        />
      </ScrollView>

      <PinModal
        visible={isPinVisible}
        onClose={() => setIsPinVisible(false)}
        onSubmit={handleConfirmPin}
        isLoading={isPending}
      />
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
  contactSection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.size.sm,
    color: colors.textMain,
    fontWeight: typography.weight.semibold as any,
    marginBottom: spacing.sm,
  },
  contactList: {
    flexDirection: 'row',
  },
  contactItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
    width: 60,
  },
  contactAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  contactName: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: spacing.xl,
  },
});

export default TransferScreen;