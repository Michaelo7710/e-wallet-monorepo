import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import * as Clipboard from 'expo-clipboard';

import { UserLayout } from '@shared/layouts';
import { ControlledInput, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useGenerate2FAMutation, useVerify2FAMutation } from '@features/auth/hooks/useAuthMutations';
import { useAuthStore } from '@core/storage/useAuthStore';
import { userLocalDataSource } from '@core/di/container';

const twoFactorSetupSchema = z.object({
  code: z
    .string()
    .length(6, { message: 'Kode harus 6 digit angka' })
    .regex(/^\d+$/, { message: 'Hanya boleh angka' }),
});

type TwoFactorSetupFormValues = z.infer<typeof twoFactorSetupSchema>;

const TwoFactorSetupScreen = () => {
  const navigation = useNavigation<any>();
  const [copied, setCopied] = useState<boolean>(false);

  const {
    mutate: generate2FA,
    data: generateData,
    isPending: isGenerating,
    isError: isGenerateError,
    error: generateError,
  } = useGenerate2FAMutation();

  const { mutate: verify2FA, isPending: isVerifying } = useVerify2FAMutation();

  const { control, handleSubmit } = useForm<TwoFactorSetupFormValues>({
    resolver: zodResolver(twoFactorSetupSchema),
    defaultValues: {
      code: '',
    },
  });

  useEffect(() => {
    generate2FA();
  }, [generate2FA]);

  const handleCopySecret = async () => {
    if (!generateData?.secret) return;
    await Clipboard.setStringAsync(generateData.secret);
    setCopied(true);
    Alert.alert('Kunci Disalin', 'Kunci rahasia 2FA telah disalin ke papan klip.');
    setTimeout(() => setCopied(false), 3000);
  };

  const onSubmit = (data: TwoFactorSetupFormValues) => {
    verify2FA(
      { token: data.code },
      {
        onSuccess: async () => {
          const user = useAuthStore.getState().user;
          if (user) {
            const updatedUser = { ...user, twoFactorEnabled: true };
            useAuthStore.getState().setUser(updatedUser);
            await userLocalDataSource.upsertProfile(updatedUser);
          }
          Alert.alert(
            '2FA Berhasil Diaktifkan!',
            'Setiap kali masuk akun, Anda akan diminta memasukkan 6 digit kode keamanan.',
            [{ text: 'Selesai', onPress: () => navigation.goBack() }]
          );
        },
        onError: (err: any) => {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            'Kode verifikasi tidak valid atau telah kedaluwarsa';
          Alert.alert('Verifikasi Gagal', errorMessage);
        },
      }
    );
  };

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
        <Text style={styles.headerTitle}>Aktivasi 2FA</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Autentikasi Dua Faktor</Text>
          <Text style={styles.subtitle}>
            Tautkan akun GreenPay Anda dengan aplikasi seperti Google Authenticator, Authy, atau Microsoft Authenticator.
          </Text>
        </View>

        {/* Tahap 1: Edukasi & Salin Kunci */}
        <View style={styles.sectionCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Langkah 1</Text>
            </View>
            <Text style={styles.sectionTitle}>Salin Kunci Penyiapan</Text>
          </View>

          <Text style={styles.stepDescription}>
            Buka Authenticator {'->'} Tambah Akun {'->'} Masukkan Kunci Penyiapan (Enter a setup key).
          </Text>

          {isGenerating ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Membuat kunci rahasia 2FA...</Text>
            </View>
          ) : isGenerateError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {(generateError as any)?.response?.data?.message ||
                  (generateError as any)?.message ||
                  'Gagal memuat kunci 2FA'}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => generate2FA()}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Coba Lagi Memuat Kunci 2FA"
              >
                <Text style={styles.retryButtonText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.secretBox}>
              <View style={styles.secretTextWrapper}>
                <Text style={styles.secretLabel}>Kunci Rahasia (Base32)</Text>
                <Text
                  style={styles.secretCode}
                  selectable={true}
                  accessibilityLabel={`Kunci Rahasia 2FA: ${generateData?.secret}`}
                >
                  {generateData?.secret || '-'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.copyButton, copied && styles.copyButtonSuccess]}
                onPress={handleCopySecret}
                activeOpacity={0.7}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Salin Kunci Rahasia 2FA"
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={copied ? colors.white : colors.primary}
                />
                <Text
                  style={[
                    styles.copyButtonText,
                    copied && styles.copyButtonTextSuccess,
                  ]}
                >
                  {copied ? 'Tersalin' : 'Salin Kunci'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tahap 2: Verifikasi Bukti */}
        <View style={styles.sectionCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>Langkah 2</Text>
            </View>
            <Text style={styles.sectionTitle}>Verifikasi Kode 6 Digit</Text>
          </View>

          <Text style={styles.stepDescription}>
            Masukkan 6 digit kode yang muncul di aplikasi autentikator Anda untuk memverifikasi pemasangan.
          </Text>

          <View style={styles.formContainer}>
            <ControlledInput
              control={control}
              name="code"
              label="Kode Keamanan 6 Digit"
              placeholder="Contoh: 123456"
              keyboardType="number-pad"
              maxLength={6}
              accessibilityLabel="Kode Keamanan 6 Digit"
            />

            <ButtonCustom
              title="Verifikasi & Aktifkan 2FA"
              onPress={handleSubmit(onSubmit)}
              isLoading={isVerifying}
              style={styles.submitButton}
            />
          </View>
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
  heroSection: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: spacing.radius.full,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.textMain,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  stepBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.radius.sm,
    marginRight: spacing.sm,
  },
  stepBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold as any,
    color: colors.primaryDark,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  stepDescription: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  errorBox: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radius.sm,
    backgroundColor: `${colors.primary}15`,
  },
  retryButtonText: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.semibold as any,
  },
  secretBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  secretTextWrapper: {
    flex: 1,
  },
  secretLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  secretCode: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
    color: colors.primaryDark,
    letterSpacing: 1.5,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radius.md,
    gap: 4,
  },
  copyButtonSuccess: {
    backgroundColor: colors.primary,
  },
  copyButtonText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold as any,
    color: colors.primary,
  },
  copyButtonTextSuccess: {
    color: colors.white,
  },
  formContainer: {
    marginTop: spacing.xs,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

export default TwoFactorSetupScreen;
