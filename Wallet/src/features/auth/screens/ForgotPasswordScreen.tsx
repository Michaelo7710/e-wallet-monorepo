import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native';

import { AuthLayout } from '@shared/layouts';
import { ControlledInput, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useForgotPasswordMutation } from '../hooks/useAuthMutations';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const { mutate: forgotPassword, isPending } = useForgotPasswordMutation();

  const { control, handleSubmit } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    forgotPassword(
      { email: data.email },
      {
        onSuccess: () => {
          Alert.alert(
            'OTP Terkirim',
            'Jika email terdaftar, kode pemulihan telah dikirimkan ke email Anda.',
            [
              {
                text: 'Lanjut',
                onPress: () => navigation.navigate('ResetPassword', { email: data.email }),
              },
            ]
          );
        },
        onError: (err: any) => {
          const errorMessage =
            err.response?.data?.message || err.message || 'Gagal mengirim kode OTP';
          Alert.alert('Gagal', errorMessage);
        },
      }
    );
  };

  return (
    <AuthLayout>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Lupa Kata Sandi</Text>
        <Text style={styles.subtitle}>
          Masukkan email akun Anda untuk menerima kode OTP pemulihan sandi.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <ControlledInput
          control={control}
          name="email"
          label="Email"
          placeholder="Masukkan email Anda"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <ButtonCustom
          title="Kirim Kode OTP"
          onPress={handleSubmit(onSubmit)}
          isLoading={isPending}
          style={styles.submitButton}
        />
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Ingat kata sandi? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginText}>Masuk</Text>
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

export default ForgotPasswordScreen;
