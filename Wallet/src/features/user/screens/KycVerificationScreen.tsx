import React, { useState } from 'react';
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

import { UserLayout } from '@shared/layouts';
import { ControlledInput, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useUpdateKycMutation } from '../hooks/useUserData';

const kycSchema = z.object({
  nik: z
    .string()
    .length(16, { message: 'NIK harus tepat 16 digit angka' })
    .regex(/^\d+$/, { message: 'NIK hanya boleh berisi angka' }),
});

type KycFormValues = z.infer<typeof kycSchema>;

const KycVerificationScreen = () => {
  const navigation = useNavigation<any>();
  const { mutate: updateKyc, isPending } = useUpdateKycMutation();

  const [avatarSeed, setAvatarSeed] = useState(() =>
    Math.random().toString(36).substring(2, 8)
  );

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/png?seed=${avatarSeed}`;

  const { control, handleSubmit } = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      nik: '',
    },
  });

  const handleRandomizeAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(2, 8));
  };

  const onSubmit = (data: KycFormValues) => {
    updateKyc(
      { nik: data.nik },
      {
        onSuccess: () => {
          Alert.alert(
            'Verifikasi Berhasil',
            'Selamat! Akun Anda kini berstatus Terverifikasi Premium dengan limit saldo Rp 50.000.000.',
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

  return (
    <UserLayout noPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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

        {/* Generator Avatar Interaktif */}
        <View style={styles.avatarSection}>
          <Text style={styles.sectionTitle}>Pilih Foto Profil Premium</Text>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarPreview}
              contentFit="cover"
              transition={300}
            />
            <TouchableOpacity
              style={styles.randomizeButton}
              activeOpacity={0.8}
              onPress={handleRandomizeAvatar}
            >
              <Ionicons name="shuffle" size={16} color={colors.primary} />
              <Text style={styles.randomizeText}>Acak Avatar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form NIK */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Data Identitas Kependudukan</Text>
          <ControlledInput
            control={control}
            name="nik"
            label="Nomor Induk Kependudukan (NIK)"
            placeholder="Contoh: 3201123456780001"
            keyboardType="number-pad"
            maxLength={16}
          />

          <ButtonCustom
            title="Ajukan Verifikasi Sekarang"
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
  limitCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
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
  avatarSection: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMain,
    marginBottom: spacing.md,
  },
  avatarWrapper: {
    alignItems: 'center',
  },
  avatarPreview: {
    width: 80,
    height: 80,
    borderRadius: spacing.radius.full,
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.md,
  },
  randomizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radius.full,
  },
  randomizeText: {
    color: colors.primary,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium as any,
    marginLeft: 4,
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

export default KycVerificationScreen;
