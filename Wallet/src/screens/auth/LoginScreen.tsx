import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigation } from '@react-navigation/native';

// Mengimpor Pasukan Persenjataan Kita
import AuthLayout from '@components/layouts/AuthLayout';
import ControlledInput from '@components/ControlledInput';
import ButtonCustom from '@components/ButtonCustom';
import { typography } from '@theme/typography';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { authService } from '@services/authService';
import { useAuthStore } from '@store/useAuthStore';

// 1. Algojo Validasi (Zod Schema)
const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
});

// Mengekstrak tipe data dari skema Zod
type LoginFormValues = z.infer<typeof loginSchema>;

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const [isLoading, setIsLoading] = useState(false);
  const loginToStore = useAuthStore((state) => state.login);

  // 2. Inisialisasi React Hook Form
  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // 3. Logika Eksekusi (Menyambungkan UI dengan Backend)
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Memanggil layanan API yang sudah bersih
      const response = await authService.login(data.email, data.password);
      
      // Jika sukses, simpan KTP Digital ke Brankas Global (Zustand)
      // Navigasi tidak perlu diatur manual, AppNavigator otomatis memindahkan 
      // user ke Home karena state isAuthenticated berubah menjadi true!
      await loginToStore(response.data.user, response.token);
      
    } catch (error: any) {
      // Menangkap balasan error dari backend (misal: "Email tidak ditemukan")
      // 1. CETAK ERROR ASLI KE TERMINAL VS CODE ANDA
    console.log("=== BUKTI FORENSIK AXIOS ===");
    if (error.response) {
      console.log("Server merespons dengan status:", error.response.status);
      console.log("Data dari server:", error.response.data);
    } else if (error.request) {
      // INI YANG SERING TERJADI SAAT NETWORK ERROR
      console.log("Request terkirim, tapi tidak ada balasan dari server.");
      console.log("Isi Request:", error.request._response); 
    } else {
      console.log("Error Setting up Request:", error.message);
    }
    console.log("URL yang ditembak Axios:", error.config?.baseURL + error.config?.url);
    console.log("============================");

  // 2. Tampilkan di UI
    const errorMessage = error.response?.data?.message || 'Terjadi kesalahan jaringan (Lihat Terminal!)';
    Alert.alert('Login Gagal', errorMessage);

      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 4. Membungkus halaman dengan Cangkang Tamu (Anti Keyboard Tertutup)
    <AuthLayout>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Selamat Datang</Text>
        <Text style={styles.subtitle}>Masuk untuk melanjutkan transaksi</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Menggunakan Jembatan Form kita! */}
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
          isPassword={true} // Otomatis memunculkan ikon mata
        />

        {/* Tombol Universal Kita */}
        <ButtonCustom
          title="Masuk"
          onPress={handleSubmit(onSubmit)} // Diperiksa oleh Zod dulu sebelum mengeksekusi onSubmit
          isLoading={isLoading}
        />
      </View>

      {/* Navigasi ke Halaman Register */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerText}>Belum punya akun? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>Daftar Sekarang</Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
};

// 5. Penataan Gaya Bebas Angka Gaib
const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold as any,
    color: colors.white, // Karena background AuthLayout biasanya gelap/gambar
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.textLight,
  },
  formContainer: {
    marginBottom: spacing.xxl,
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
  registerText: {
    color: colors.accent,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold as any,
  },
});

export default LoginScreen;