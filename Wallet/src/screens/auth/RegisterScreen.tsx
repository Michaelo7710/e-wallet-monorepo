import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native';

import AuthLayout from '@components/layouts/AuthLayout';
import ControlledInput from '@components/ControlledInput';
import ButtonCustom from '@components/ButtonCustom';
import { typography } from '@theme/typography';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { authService } from '@services/authService';
import { useAuthStore } from '@store/useAuthStore';

// 1. Algojo Validasi Canggih (Cross-Field Validation)
const registerSchema = z.object({
  username: z.string().min(3, { message: 'Nama minimal 3 karakter' }),
  email: z.string().email({ message: 'Format email tidak valid' }),
  phone_number: z.string()
    .min(10, { message: 'Nomor HP minimal 10 digit' })
    .max(15, { message: 'Nomor HP maksimal 15 digit' })
    .regex(/^[0-9+]+$/, { message: 'Hanya boleh berisi angka atau simbol +' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
  confirmPassword: z.string().min(6, { message: 'Konfirmasi password minimal 6 karakter' }),
}).refine((data) => data.password === data.confirmPassword, {
  // Mengecek apakah password dan konfirmasi sama persis
  message: "Password tidak cocok",
  path: ["confirmPassword"], // Menaruh pesan error berwarna merah di kolom confirmPassword
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(false);
  const loginToStore = useAuthStore((state) => state.login);

  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      username: '', 
      email: '', 
      phone_number: '', 
      password: '', 
      confirmPassword: '' 
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // Ingat: kita tidak mengirim confirmPassword ke backend
      const response = await authService.register(
        data.username,
        data.email,
        data.phone_number,
        data.password
      );
      
      // Jika sukses mendaftar, backend akan membalas dengan KTP Digital (Token).
      // Langsung login-kan user agar mereka tidak perlu mengisi form login lagi.
      await loginToStore(response.data.user, response.token);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal membuat akun';
      Alert.alert('Pendaftaran Gagal', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* ScrollView dengan flexGrow agar UI bisa digulir ke bawah saat form panjang */}
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // Mencegah keyboard menutup sendiri saat scroll
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Buat Akun</Text>
          <Text style={styles.subtitle}>Mulai perjalanan finansialmu sekarang</Text>
        </View>

        <View style={styles.formContainer}>
          <ControlledInput
            control={control}
            name="username"
            label="Nama Lengkap"
            placeholder="Ketik nama sesuai KTP"
          />

          <ControlledInput
            control={control}
            name="email"
            label="Email"
            placeholder="Ketik email aktif"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <ControlledInput
            control={control}
            name="phone_number"
            label="Nomor Handphone"
            placeholder="Contoh: 08123456789"
            keyboardType="phone-pad" // Otomatis menampilkan keyboard angka di HP
          />

          <ControlledInput
            control={control}
            name="password"
            label="Password"
            placeholder="Buat password (min. 6 karakter)"
            isPassword={true}
          />

          <ControlledInput
            control={control}
            name="confirmPassword"
            label="Konfirmasi Password"
            placeholder="Ketik ulang password"
            isPassword={true}
          />

          <ButtonCustom
            title="Daftar Akun"
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Sudah punya akun? </Text>
          {/* Navigasi kembali ke Login */}
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Masuk di sini</Text>
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

export default RegisterScreen;