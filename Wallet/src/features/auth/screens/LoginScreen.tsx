// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import * as z from 'zod';
// import { useNavigation } from '@react-navigation/native';

// import { AuthLayout } from '@shared/layouts';
// import { ControlledInput, ButtonCustom } from '@shared/components';
// import { colors, typography, spacing } from '@core/theme';
// import { useAuthStore } from '@core/storage/useAuthStore';
// import { authService } from '../services/authService';

// const loginSchema = z.object({
//   email: z.string().email({ message: 'Format email tidak valid' }),
//   password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
// });

// type LoginFormValues = z.infer<typeof loginSchema>;

// const LoginScreen = () => {
//   const navigation = useNavigation<any>();
//   const [isLoading, setIsLoading] = useState(false);
//   const loginToStore = useAuthStore((state) => state.login);

//   const { control, handleSubmit } = useForm<LoginFormValues>({
//     resolver: zodResolver(loginSchema),
//     defaultValues: { email: '', password: '' },
//   });

//   const onSubmit = async (data: LoginFormValues) => {
//     setIsLoading(true);
//     try {
//       const response = await authService.login(data.email, data.password);
//       // Mendukung Dual Token: Access Token & Refresh Token
//       const refreshToken = response.refresh_token || response.token;
//       await loginToStore(response.data.user, response.token, refreshToken);
//     } catch (error: any) {
//       const errorMessage = error.response?.data?.message || 'Terjadi kesalahan jaringan';
//       Alert.alert('Login Gagal', errorMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <AuthLayout>
//       <View style={styles.headerContainer}>
//         <Text style={styles.title}>Selamat Datang</Text>
//         <Text style={styles.subtitle}>Masuk untuk melanjutkan transaksi</Text>
//       </View>
//       <View style={styles.formContainer}>
//         <ControlledInput
//           control={control}
//           name="email"
//           label="Email"
//           placeholder="Masukkan email Anda"
//           keyboardType="email-address"
//           autoCapitalize="none"
//         />
//         <ControlledInput
//           control={control}
//           name="password"
//           label="Password"
//           placeholder="Masukkan password Anda"
//           isPassword={true}
//         />
//         <ButtonCustom
//           title="Masuk"
//           onPress={handleSubmit(onSubmit)}
//           isLoading={isLoading}
//         />
//       </View>
//       <View style={styles.footerContainer}>
//         <Text style={styles.footerText}>Belum punya akun? </Text>
//         <TouchableOpacity onPress={() => navigation.navigate('Register')}>
//           <Text style={styles.registerText}>Daftar Sekarang</Text>
//         </TouchableOpacity>
//       </View>
//     </AuthLayout>
//   );
// };

// const styles = StyleSheet.create({
//   headerContainer: { marginBottom: spacing.xxxl },
//   title: {
//     fontSize: typography.size.xxxl,
//     fontWeight: typography.weight.bold as any,
//     color: colors.white,
//     marginBottom: spacing.sm,
//   },
//   subtitle: { fontSize: typography.size.md, color: colors.textLight },
//   formContainer: { marginBottom: spacing.xxl },
//   footerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
//   footerText: { color: colors.white, fontSize: typography.size.sm },
//   registerText: {
//     color: colors.accent,
//     fontSize: typography.size.sm,
//     fontWeight: typography.weight.bold as any,
//   },
// });

// export default LoginScreen;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native';
import { AuthLayout } from '@shared/layouts';
import { ControlledInput, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useAuthStore } from '@core/storage/useAuthStore';
import { useLoginMutation } from '../hooks/useAuthMutations';

const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const loginSession = useAuthStore((state) => state.loginSession);
  const { mutate: login, isPending } = useLoginMutation();

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data, {
      onSuccess: async (session) => {
        if (session.user.twoFactorEnabled) {
          navigation.navigate('TwoFactorAuth', {
            user: session.user,
            tokens: session.tokens,
          });
        } else {
          await loginSession(
            session.user,
            session.tokens.accessToken,
            session.tokens.refreshToken
          );
        }
      },
      onError: (error: any) => {
        const message = error.response?.data?.message || error.message || 'Login Gagal';
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
  footerContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { color: colors.white, fontSize: typography.size.sm },
  registerText: {
    color: colors.accent,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold as any,
  },
});

export default LoginScreen;