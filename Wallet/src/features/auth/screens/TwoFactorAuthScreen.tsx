import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation, useRoute } from '@react-navigation/native';

import { AuthLayout } from '@shared/layouts';
import { ControlledInput, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useAuthStore } from '@core/storage/useAuthStore';
import { useVerify2FAMutation } from '../hooks/useAuthMutations';
import { User } from '@domain/entities/user';
import { AuthTokens } from '@domain/repositories/auth.repository.interface';

const twoFactorSchema = z.object({
  token: z
    .string()
    .length(6, { message: 'Kode 2FA harus 6 digit' })
    .regex(/^\d+$/, { message: 'Hanya boleh berisi angka' }),
});

type TwoFactorFormValues = z.infer<typeof twoFactorSchema>;

interface RouteParams {
  user: User;
  tokens: AuthTokens;
}

const TwoFactorAuthScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, tokens } = (route.params as RouteParams) || {};

  const loginSession = useAuthStore((state) => state.loginSession);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const { mutate: verify2FA, isPending } = useVerify2FAMutation();

  const { control, handleSubmit } = useForm<TwoFactorFormValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      token: '',
    },
  });

  const handleCancel = () => {
    setAccessToken('');
    navigation.navigate('Login');
  };

  const onSubmit = (data: TwoFactorFormValues) => {
    if (!user || !tokens?.accessToken) {
      Alert.alert(
        'Sesi Tidak Valid',
        'Informasi login sementara tidak ditemukan. Silakan masuk kembali.',
        [{ text: 'Kembali ke Login', onPress: handleCancel }]
      );
      return;
    }

    // Set token sementara ke in-memory store agar request POST /auth/2fa/verify membawa Bearer token
    setAccessToken(tokens.accessToken);

    verify2FA(
      { token: data.token },
      {
        onSuccess: async () => {
          await loginSession(user, tokens.accessToken, tokens.refreshToken);
        },
        onError: (err: any) => {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            'Kode otentikasi salah atau telah kedaluwarsa.';
          Alert.alert('Verifikasi 2FA Gagal', errorMessage);
        },
      }
    );
  };

  return (
    <AuthLayout>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Verifikasi 2FA</Text>
        <Text style={styles.subtitle}>
          Buka aplikasi Google Authenticator atau Authy Anda dan masukkan 6 digit kode keamanan untuk{' '}
          <Text style={styles.emailHighlight}>{user?.email || 'akun Anda'}</Text>.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <ControlledInput
          control={control}
          name="token"
          label="Kode Otentikasi 2FA"
          placeholder="Contoh: 123456"
          keyboardType="number-pad"
          maxLength={6}
        />
        <ButtonCustom
          title="Verifikasi & Masuk"
          onPress={handleSubmit(onSubmit)}
          isLoading={isPending}
          style={styles.submitButton}
        />
      </View>

      <View style={styles.footerContainer}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Batalkan dan Masuk Kembali</Text>
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
  cancelText: {
    color: colors.accent,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium as any,
  },
});

export default TwoFactorAuthScreen;
