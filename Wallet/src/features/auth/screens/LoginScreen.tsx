import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { AuthLayout } from '@shared/layouts';
import { ControlledInput, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useAuthStore } from '@core/storage/useAuthStore';
import { useTempAuthStore } from '@core/storage/useTempAuthStore';
import { useLoginMutation } from '../hooks/useAuthMutations';
import { BiometricsService } from '@core/security/biometrics.service';

const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const loginSession = useAuthStore((state) => state.loginSession);
  const isBiometricsEnabled = useAuthStore((state) => state.isBiometricsEnabled);
  const fastLoginWithBiometrics = useAuthStore((state) => state.fastLoginWithBiometrics);
  const { mutate: login, isPending } = useLoginMutation();

  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState<boolean>(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState<boolean>(false);

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    const detectBiometrics = async () => {
      try {
        const available = await BiometricsService.isAvailable();
        setIsBiometricsAvailable(available);
      } catch {
        setIsBiometricsAvailable(false);
      }
    };

    detectBiometrics();
  }, []);

  const handleBiometricAuth = async () => {
    setIsBiometricLoading(true);
    try {
      const success = await fastLoginWithBiometrics();
      if (!success) {
        Alert.alert(
          'Autentikasi Dibatalkan',
          'Silakan gunakan email dan kata sandi Anda untuk masuk.'
        );
      }
    } catch {
      Alert.alert(
        'Autentikasi Gagal',
        'Gagal memverifikasi biometrik. Silakan gunakan kata sandi.'
      );
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const onSubmit = (data: LoginFormValues) => {
    login(data, {
      onSuccess: async (result) => {
        if (result.require2FA) {
          // Simpan kredensial sementara di RAM terisolasi, sterilkan navigation params
          useTempAuthStore.getState().setPreAuthSession(result.preAuthToken, result.user);
          navigation.navigate('TwoFactorAuth');
        } else {
          await loginSession(
            result.session.user,
            result.session.tokens.accessToken,
            result.session.tokens.refreshToken
          );
        }
      },
      onError: (error: any) => {
        const message =
          error.response?.data?.message || error.message || 'Login Gagal';
        Alert.alert('Gagal Masuk', message);
      },
    });
  };

  return (
    <AuthLayout>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Selamat Datang</Text>
        <Text style={styles.subtitle}>Masuk untuk melanjutkan transaksi</Text>
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
        <ControlledInput
          control={control}
          name="password"
          label="Password"
          placeholder="Masukkan password Anda"
          isPassword
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotPasswordButton}
        >
          <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
        </TouchableOpacity>

        <ButtonCustom
          title="Masuk"
          onPress={handleSubmit(onSubmit)}
          isLoading={isPending}
        />

        {isBiometricsAvailable && isBiometricsEnabled && (
          <View style={styles.biometricSection}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ATAU</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.biometricButton}
              activeOpacity={0.8}
              onPress={handleBiometricAuth}
              disabled={isBiometricLoading || isPending}
            >
              <Ionicons
                name="finger-print-outline"
                size={22}
                color={colors.accent}
                style={{ marginRight: spacing.sm }}
              />
              <Text style={styles.biometricButtonText}>
                Masuk Cepat dengan Biometrik
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Belum punya akun? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>Daftar Sekarang</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  headerContainer: { marginBottom: spacing.xxxl },
  title: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold as any,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: { fontSize: typography.size.md, color: colors.textLight },
  formContainer: { marginBottom: spacing.xxl },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
  },
  forgotPasswordText: {
    color: colors.accent,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium as any,
  },
  biometricSection: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: colors.textLight,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold as any,
    marginHorizontal: spacing.sm,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: spacing.radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  biometricButtonText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold as any,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: { color: colors.white, fontSize: typography.size.sm },
  registerText: {
    color: colors.accent,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold as any,
  },
});

export default LoginScreen;