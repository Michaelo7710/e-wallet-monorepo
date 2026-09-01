import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation, useRoute } from '@react-navigation/native';

import { AuthLayout } from '@shared/layouts';
import { ControlledInput, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useVerifyEmailMutation } from '../hooks/useAuthMutations';

const verifyEmailSchema = z.object({
  code: z
    .string()
    .length(6, { message: 'Kode OTP harus 6 digit' })
    .regex(/^\d+$/, { message: 'Kode OTP hanya boleh berisi angka' }),
});

type VerifyEmailFormValues = z.infer<typeof verifyEmailSchema>;

const VerifyEmailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { email } = (route.params as { email?: string }) || {};

  const { mutate: verifyEmail, isPending } = useVerifyEmailMutation();

  const { control, handleSubmit } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: '',
    },
  });

  const onSubmit = (data: VerifyEmailFormValues) => {
    if (!email) {
      Alert.alert(
        'Email Tidak Ditemukan',
        'Informasi email tidak valid. Silakan lakukan registrasi atau masuk kembali.',
        [{ text: 'Kembali', onPress: () => navigation.navigate('Login') }]
      );
      return;
    }

    verifyEmail(
      { email, code: data.code },
      {
        onSuccess: () => {
          Alert.alert(
            'Verifikasi Berhasil',
            'Akun Anda telah aktif. Silakan masuk.',
            [{ text: 'Masuk', onPress: () => navigation.navigate('Login') }]
          );
        },
        onError: (err: any) => {
          const errorMessage =
            err.response?.data?.message || err.message || 'Verifikasi Gagal';
          Alert.alert('Verifikasi Gagal', errorMessage);
        },
      }
    );
  };

  return (
    <AuthLayout>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Verifikasi Akun</Text>
        <Text style={styles.subtitle}>
          Masukkan 6 digit kode OTP yang telah dikirimkan ke email{' '}
          <Text style={styles.emailHighlight}>{email || 'Anda'}</Text>
        </Text>
      </View>

      <View style={styles.formContainer}>
        <ControlledInput
          control={control}
          name="code"
          label="Kode OTP"
          placeholder="Contoh: 123456"
          keyboardType="number-pad"
          maxLength={6}
        />
        <ButtonCustom
          title="Verifikasi Sekarang"
          onPress={handleSubmit(onSubmit)}
          isLoading={isPending}
          style={styles.submitButton}
        />
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Salah memasukkan email? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Kembali ke Login</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: spacing.xxxl,
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
    marginBottom: spacing.xxl,
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

export default VerifyEmailScreen;
