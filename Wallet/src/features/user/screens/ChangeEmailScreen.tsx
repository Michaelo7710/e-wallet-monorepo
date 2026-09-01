import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { UserLayout } from '@shared/layouts';
import { ControlledInput, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useUpdateEmailMutation } from '../hooks/useUserData';

const changeEmailSchema = z.object({
  newEmail: z.string().email({ message: 'Format email baru tidak valid' }),
  otp: z
    .string()
    .length(6, { message: 'Kode OTP/2FA harus 6 digit angka' })
    .regex(/^\d+$/, { message: 'Hanya boleh berisi angka' }),
  pin: z
    .string()
    .length(6, { message: 'PIN transaksi harus 6 digit angka' })
    .regex(/^\d+$/, { message: 'Hanya boleh berisi angka' }),
});

type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;

const ChangeEmailScreen = () => {
  const navigation = useNavigation<any>();
  const { mutate: updateEmail, isPending } = useUpdateEmailMutation();

  const { control, handleSubmit } = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: '',
      otp: '',
      pin: '',
    },
  });

  const onSubmit = (data: ChangeEmailFormValues) => {
    updateEmail(
      {
        newEmail: data.newEmail,
        otp: data.otp,
        pin: data.pin,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Email Berhasil Diperbarui',
            'Alamat email akun Anda resmi dimutasi.',
            [{ text: 'Selesai', onPress: () => navigation.goBack() }]
          );
        },
        onError: (err: any) => {
          const errorMessage =
            err.response?.data?.message || err.message || 'Gagal memperbarui email';
          Alert.alert('Gagal Memperbarui Email', errorMessage);
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
        <Text style={styles.headerTitle}>Ubah Alamat Email</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoBox}>
          <Text style={styles.subtitle}>
            Masukkan email baru, kode verifikasi OTP/2FA, dan PIN transaksi Anda.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <ControlledInput
            control={control}
            name="newEmail"
            label="Email Baru"
            placeholder="nama@domain.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <ControlledInput
            control={control}
            name="otp"
            label="Kode OTP / Token 2FA"
            placeholder="6 Digit OTP"
            keyboardType="number-pad"
            maxLength={6}
          />

          <ControlledInput
            control={control}
            name="pin"
            label="PIN Transaksi"
            placeholder="6 Digit PIN"
            keyboardType="number-pad"
            maxLength={6}
            isPassword
          />

          <ButtonCustom
            title="Konfirmasi Pembaruan Email"
            onPress={handleSubmit(onSubmit)}
            isLoading={isPending}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  contentContainer: {
    paddingBottom: spacing.xxxl,
  },
  infoBox: {
    marginVertical: spacing.md,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  formContainer: {
    marginTop: spacing.md,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});

export default ChangeEmailScreen;
