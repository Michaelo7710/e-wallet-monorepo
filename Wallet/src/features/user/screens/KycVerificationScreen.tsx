import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as ImagePicker from 'expo-image-picker';

import { UserLayout } from '@shared/layouts';
import { ControlledInput, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useAuthStore } from '@core/storage/useAuthStore';
import { useUpdateKycMutation } from '../hooks/useUserData';

const kycSchema = z.object({
  nik: z
    .string()
    .length(16, { message: 'NIK harus tepat 16 digit angka' })
    .regex(/^\d+$/, { message: 'NIK hanya boleh berisi angka' }),
  bio: z
    .string()
    .min(10, { message: 'Deskripsi profil/tujuan transaksi minimal 10 karakter' }),
  idCardPhoto: z
    .string()
    .min(1, { message: 'Foto fisik KTP wajib dilampirkan' }),
});

type KycFormValues = z.infer<typeof kycSchema>;

const KycVerificationScreen = () => {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const { mutate: updateKyc, isPending } = useUpdateKycMutation();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      nik: user?.nik || '',
      bio: user?.bio || '',
      idCardPhoto: user?.idCardPhoto || '',
    },
  });

  const selectedPhoto = watch('idCardPhoto');

  const handlePickImage = async () => {
    Alert.alert(
      'Unggah Foto KTP',
      'Pilih metode pengambilan dokumen fisik identitas Anda',
      [
        {
          text: 'Kamera',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  'Izin Kamera Ditolak',
                  'Aplikasi membutuhkan izin kamera untuk memotret fisik KTP Anda.'
                );
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.7,
                base64: true,
              });

              if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                const photoString = asset.base64
                  ? `data:image/jpeg;base64,${asset.base64}`
                  : asset.uri;
                setValue('idCardPhoto', photoString, { shouldValidate: true });
              }
            } catch (err: any) {
              Alert.alert('Gagal Mengakses Kamera', err.message || 'Terjadi kesalahan sistem.');
            }
          },
        },
        {
          text: 'Galeri Foto',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  'Izin Galeri Ditolak',
                  'Aplikasi membutuhkan izin galeri untuk memilih foto dokumen KTP.'
                );
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                quality: 0.7,
                base64: true,
              });

              if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                const photoString = asset.base64
                  ? `data:image/jpeg;base64,${asset.base64}`
                  : asset.uri;
                setValue('idCardPhoto', photoString, { shouldValidate: true });
              }
            } catch (err: any) {
              Alert.alert('Gagal Membuka Galeri', err.message || 'Terjadi kesalahan sistem.');
            }
          },
        },
        { text: 'Batal', style: 'cancel' },
      ]
    );
  };

  const onSubmit = (data: KycFormValues) => {
    updateKyc(
      {
        nik: data.nik,
        idCardPhoto: data.idCardPhoto,
        bio: data.bio,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Verifikasi Berhasil!',
            'Akun Anda resmi ditingkatkan ke status Premium dengan limit saldo Rp 50.000.000.',
            [{ text: 'Selesai', onPress: () => navigation.goBack() }]
          );
        },
        onError: (err: any) => {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            'Gagal memproses verifikasi KYC.';
          Alert.alert('Verifikasi Gagal', errorMessage);
        },
      }
    );
  };

  // Pintu Gerbang 1: 2FA Security Gate
  if (!user?.twoFactorEnabled) {
    return (
      <UserLayout noPadding={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <Ionicons name="arrow-back" size={24} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verifikasi KYC</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gateContentContainer}
        >
          <View style={styles.gateCard}>
            <View style={styles.gateIconCircle}>
              <Ionicons name="shield-outline" size={48} color={colors.warning} />
            </View>
            <Text style={styles.gateTitle}>Aktivasi 2FA Diperlukan</Text>
            <Text style={styles.gateDescription}>
              Sesuai standar kepatuhan perbankan, akun Anda wajib mengaktifkan Autentikasi Dua Faktor (2FA) sebelum dapat mengajukan kenaikan limit saldo Premium Rp 50.000.000.
            </Text>

            <ButtonCustom
              title="Aktifkan 2FA Sekarang"
              onPress={() => navigation.navigate('TwoFactorSetup')}
              style={styles.gateButton}
            />
          </View>
        </ScrollView>
      </UserLayout>
    );
  }

  // Pintu Gerbang 2: Formulir Verifikasi Otentik (Jika 2FA Aktif)
  return (
    <UserLayout noPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade Akun Premium</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner Komparasi Limit */}
        <View style={styles.limitCard}>
          <View style={styles.limitHeader}>
            <View style={styles.badgePremium}>
              <Ionicons name="shield-checkmark" size={14} color={colors.white} />
              <Text style={styles.badgePremiumText}>KYC Identity Verification</Text>
            </View>
          </View>
          <Text style={styles.limitCardTitle}>Tingkatkan Batas Saldo Dompet</Text>
          <View style={styles.limitComparison}>
            <View style={styles.limitBox}>
              <Text style={styles.limitBoxLabel}>Sebelum KYC</Text>
              <Text style={styles.limitBoxValue}>Rp 5.000.000</Text>
              <Text style={styles.limitBoxSub}>Akun Basic</Text>
            </View>
            <View style={styles.arrowBox}>
              <Ionicons name="arrow-forward" size={20} color={colors.accent} />
            </View>
            <View style={[styles.limitBox, styles.limitBoxHighlight]}>
              <Text style={[styles.limitBoxLabel, { color: colors.primaryDark }]}>
                Setelah KYC
              </Text>
              <Text style={[styles.limitBoxValue, { color: colors.primaryDark }]}>
                Rp 50.000.000
              </Text>
              <Text style={[styles.limitBoxSub, { color: colors.primary }]}>
                Akun Premium
              </Text>
            </View>
          </View>
        </View>

        {/* Modul Pengambilan Foto KTP */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Dokumen Fisik Identitas (KTP)</Text>
          <Text style={styles.sectionSubtitle}>
            Unggah foto fisik KTP asli Anda untuk verifikasi identitas resmi.
          </Text>

          {selectedPhoto ? (
            <View style={styles.idCardFrame}>
              <Image
                source={{ uri: selectedPhoto }}
                style={styles.idCardImage}
                contentFit="cover"
                transition={300}
              />
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={handlePickImage}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Ganti Foto KTP"
              >
                <Ionicons name="camera-reverse-outline" size={18} color={colors.white} />
                <Text style={styles.changePhotoText}>Ganti Foto KTP</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.idCardPlaceholder,
                errors.idCardPhoto && styles.idCardPlaceholderError,
              ]}
              onPress={handlePickImage}
              activeOpacity={0.7}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Ambil Foto KTP"
            >
              <View style={styles.idCardIconCircle}>
                <Ionicons name="camera-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.idCardPlaceholderTitle}>Ambil Foto KTP</Text>
              <Text style={styles.idCardPlaceholderSubtitle}>
                Ketuk di sini untuk mengambil foto melalui kamera atau galeri
              </Text>
            </TouchableOpacity>
          )}

          {errors.idCardPhoto && (
            <Text style={styles.fieldErrorText}>{errors.idCardPhoto.message}</Text>
          )}
        </View>

        {/* Form NIK & Bio */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Data & Deklarasi Nasabah</Text>

          <ControlledInput
            control={control}
            name="nik"
            label="Nomor Induk Kependudukan (NIK)"
            placeholder="Contoh: 3201123456780001"
            keyboardType="number-pad"
            maxLength={16}
            accessibilityLabel="Nomor Induk Kependudukan 16 Digit"
          />

          <ControlledInput
            control={control}
            name="bio"
            label="Deskripsi Profil / Sumber Dana"
            placeholder="Contoh: Wiraswasta, keperluan transaksi bisnis harian"
            multiline
            numberOfLines={3}
            accessibilityLabel="Deskripsi Profil dan Sumber Dana"
          />

          <ButtonCustom
            title="Kirim Berkas Verifikasi Premium"
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
  gateContentContainer: {
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  gateCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    shadowColor: colors.textMain,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: spacing.lg,
  },
  gateIconCircle: {
    width: 80,
    height: 80,
    borderRadius: spacing.radius.full,
    backgroundColor: `${colors.warning}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  gateTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  gateDescription: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  gateButton: {
    width: '100%',
  },
  limitCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.textMain,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badgePremium: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.radius.full,
  },
  badgePremiumText: {
    color: colors.white,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold as any,
    marginLeft: 4,
  },
  limitCardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    marginBottom: spacing.md,
  },
  limitComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  limitBoxHighlight: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  arrowBox: {
    paddingHorizontal: spacing.xs,
  },
  limitBoxLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  limitBoxValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    marginBottom: 2,
  },
  limitBoxSub: {
    fontSize: typography.size.xs,
    color: colors.textLight,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  idCardFrame: {
    width: '100%',
    height: 200,
    borderRadius: spacing.radius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  idCardImage: {
    width: '100%',
    height: '100%',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radius.full,
    gap: 4,
  },
  changePhotoText: {
    color: colors.white,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium as any,
  },
  idCardPlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: spacing.radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  idCardPlaceholderError: {
    borderColor: colors.error,
    backgroundColor: `${colors.error}08`,
  },
  idCardIconCircle: {
    width: 56,
    height: 56,
    borderRadius: spacing.radius.full,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  idCardPlaceholderTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    marginBottom: 4,
  },
  idCardPlaceholderSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  fieldErrorText: {
    fontSize: typography.size.xs,
    color: colors.error,
    marginTop: 6,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

export default KycVerificationScreen;
