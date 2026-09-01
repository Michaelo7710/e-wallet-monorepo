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
import { useUpdatePinMutation } from '../hooks/useUserData';

const changePinSchema = z
  .object({
    oldPin: z
      .string()
      .length(6, { message: 'PIN lama harus 6 digit angka' })
      .regex(/^\d+$/, { message: 'Hanya boleh berisi angka' }),
    otp: z
      .string()
      .length(6, { message: 'Kode OTP/2FA harus 6 digit angka' })
      .regex(/^\d+$/, { message: 'Hanya boleh berisi angka' }),
    newPin: z
      .string()
      .length(6, { message: 'PIN baru harus 6 digit angka' })
      .regex(/^\d+$/, { message: 'Hanya boleh berisi angka' }),
    confirmNewPin: z
      .string()
      .length(6, { message: 'Konfirmasi PIN baru harus 6 digit angka' })
      .regex(/^\d+$/, { message: 'Hanya boleh berisi angka' }),
  })
  .refine((data) => data.newPin === data.confirmNewPin, {
    message: 'Konfirmasi PIN baru tidak cocok',
    path: ['confirmNewPin'],
  });

type ChangePinFormValues = z.infer<typeof changePinSchema>;

const ChangePinScreen = () => {
  const navigation = useNavigation<any>();
  const { mutate: updatePin, isPending } = useUpdatePinMutation();

  const { control, handleSubmit } = useForm<ChangePinFormValues>({
    resolver: zodResolver(changePinSchema),
    defaultValues: {
      oldPin: '',
      otp: '',
      newPin: '',
      confirmNewPin: '',
    },
  });

  const onSubmit = (data: ChangePinFormValues) => {
    updatePin(
      {
        oldPin: data.oldPin,
        otp: data.otp,
        newPin: data.newPin,
        confirmNewPin: data.confirmNewPin,
      },
      {
        onSuccess: () => {
          Alert.alert('Sukses', 'PIN transaksi Anda berhasil diperbarui.', [
            { text: 'Kembali', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (err: any) => {
          const errorMessage =
            err.response?.data?.message || err.message || 'Gagal memperbarui PIN transaksi';
          Alert.alert('Gagal Memperbarui PIN', errorMessage);
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
        <Text style={styles.headerTitle}>Ubah PIN Transaksi</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoBox}>
          <Text style={styles.subtitle}>
            Masukkan PIN lama, kode verifikasi OTP/TOTP 2FA, dan PIN baru Anda.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <ControlledInput
            control={control}
            name="oldPin"
            label="PIN Lama"
            placeholder="6 Digit PIN Lama"
            keyboardType="number-pad"
            maxLength={6}
            isPassword
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
            name="newPin"
            label="PIN Baru"
            placeholder="6 Digit PIN Baru"
            keyboardType="number-pad"
            maxLength={6}
            isPassword
          />

          <ControlledInput
            control={control}
            name="confirmNewPin"
            label="Konfirmasi PIN Baru"
            placeholder="Ketik ulang 6 Digit PIN Baru"
            keyboardType="number-pad"
            maxLength={6}
            isPassword
          />

          <ButtonCustom
            title="Perbarui PIN Transaksi"
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

export default ChangePinScreen;
