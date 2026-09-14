import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation, useRoute } from '@react-navigation/native';

import { AuthLayout } from '@shared/layouts';
import { ControlledInput, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useResetPasswordMutation } from '../hooks/useAuthMutations';

const resetPasswordSchema = z
  .object({
    otp: z
      .string()
      .length(6, { message: 'Kode OTP harus 6 digit angka' })
      .regex(/^\d+$/, { message: 'Hanya boleh berisi angka' }),
    newPassword: z.string().min(8, { message: 'Password baru minimal 8 karakter' }),
    confirmNewPassword: z.string().min(8, { message: 'Konfirmasi password minimal 8 karakter' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['confirmNewPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const ResetPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { email } = (route.params as { email?: string }) || {};

  const { mutate: resetPassword, isPending } = useResetPasswordMutation();

  const { control, handleSubmit } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otp: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    if (!email) {
      Alert.alert(
        'Email Tidak Ditemukan',
        'Informasi email tidak valid. Silakan ajukan permintaan lupa sandi kembali.',
        [{ text: 'Kembali', onPress: () => navigation.navigate('ForgotPassword') }]
      );
      return;
    }

    resetPassword(
      { email, otp: data.otp, newPassword: data.newPassword },
      {
        onSuccess: () => {
          Alert.alert(
            'Sandi Berhasil Diubah',
            'Kata sandi Anda telah diperbarui. Silakan masuk menggunakan kata sandi baru.',
            [{ text: 'Masuk Sekarang', onPress: () => navigation.navigate('Login') }]
          );
        },
        onError: (err: any) => {
          const errorMessage =
            err.response?.data?.message || err.message || 'Gagal mengubah kata sandi';
          Alert.alert('Gagal Mengubah Sandi', errorMessage);
        },
      }
    );
  };

  return (
    <AuthLayout>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Atur Ulang Sandi</Text>
          <Text style={styles.subtitle}>
            Ketik kode OTP dan masukkan kata sandi baru untuk akun{' '}
            <Text style={styles.emailHighlight}>{email || 'Anda'}</Text>.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <ControlledInput
            control={control}
            name="otp"
            label="Kode OTP"
            placeholder="6 Digit OTP"
            keyboardType="number-pad"
            maxLength={6}
          />
          <ControlledInput
            control={control}
            name="newPassword"
            label="Kata Sandi Baru"
            placeholder="Minimal 8 karakter"
            isPassword
          />
          <ControlledInput
            control={control}
            name="confirmNewPassword"
            label="Konfirmasi Sandi Baru"
            placeholder="Ketik ulang kata sandi baru"
            isPassword
          />
          <ButtonCustom
            title="Simpan Kata Sandi Baru"
            onPress={handleSubmit(onSubmit)}
            isLoading={isPending}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Batal atur ulang? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Kembali ke Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  headerContainer: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold as any,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.textLight,
    lineHeight: 22,
  },
  emailHighlight: {
    fontWeight: typography.weight.bold as any,
    color: colors.accent,
  },
  formContainer: {
    marginBottom: spacing.xl,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.white,
    fontSize: typography.size.sm,
  },
  loginText: {
    color: colors.accent,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold as any,
  },
});

export default ResetPasswordScreen;
