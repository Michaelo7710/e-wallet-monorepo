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
import { UserMapper } from '@data/mappers/userMapper';
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

  const loginSession = useAuthStore((state) => state.loginSession);
  const { mutate: verifyEmail, isPending } = useVerifyEmailMutation();

  const { control, handleSubmit } = useForm<VerifyEmailFormValues>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: '',
    },
  });

  const handleVerifySuccess = async (response: any) => {
    try {
      // Ekstraksi defensif mendukung response.data.data maupun response.data
      const payload = response?.data?.data || response?.data || response;
      const user = payload?.user;
      const accessToken = payload?.access_token || payload?.accessToken || payload?.token;
      const refreshToken = payload?.refresh_token || payload?.refreshToken;

      // Jika server mengembalikan sesi lengkap (Backend Baru):
      if (user && accessToken && refreshToken) {
        const sessionUser = {
          ...UserMapper.toDomain(user),
          id: user.id || user._id,
          _id: user._id || user.id,
        };
        await loginSession(sessionUser as any, accessToken, refreshToken);
        Alert.alert('Selamat Datang!', 'Email Anda berhasil diverifikasi. Sesi Anda telah aktif.');
        // Navigasi otomatis di-handle oleh perubahan state authStore di AppNavigator
        return;
      }

      // Fallback jika backend cloud belum mengembalikan token (Legacy Backend Fallback):
      console.warn(' [VERIFY_EMAIL] Server tidak mengembalikan token sesi lengkap. Mengalihkan ke Login manual.');
      Alert.alert(
        'Verifikasi Berhasil',
        'Email Anda telah terverifikasi. Silakan masuk dengan kata sandi Anda.',
        [{ text: 'Masuk Sekarang', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      console.error(' [VERIFY_EMAIL] Gagal memproses sesi:', err);
      navigation.navigate('Login');
    }
  };

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
        onSuccess: handleVerifySuccess,
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
