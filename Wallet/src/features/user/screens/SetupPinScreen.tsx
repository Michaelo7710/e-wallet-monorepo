import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { feedback } from '@core/feedback';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { UserLayout } from '@shared/layouts';
import { ControlledInput, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useAuthStore } from '@core/storage/useAuthStore';
import { useSetupPinMutation } from '../hooks/useUserData';

export const setupPinSchema = z
  .object({
    pin: z
      .string()
      .length(6, { message: 'PIN harus 6 digit angka' })
      .regex(/^\d+$/, { message: 'Hanya boleh berisi angka' }),
    confirmPin: z
      .string()
      .length(6, { message: 'Konfirmasi PIN harus 6 digit angka' })
      .regex(/^\d+$/, { message: 'Hanya boleh berisi angka' }),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: 'Konfirmasi PIN tidak cocok',
    path: ['confirmPin'],
  });

export type SetupPinFormValues = z.infer<typeof setupPinSchema>;

const SetupPinScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const hasPin = Boolean(user?.hasPin);

  const { mutate: setupPin, isPending } = useSetupPinMutation();

  const { control, handleSubmit } = useForm<SetupPinFormValues>({
    resolver: zodResolver(setupPinSchema),
    defaultValues: {
      pin: '',
      confirmPin: '',
    },
  });

  const handleRedirectToChangePin = React.useCallback(() => {
    if (typeof navigation.replace === 'function') {
      navigation.replace('ChangePin');
    } else {
      navigation.navigate('ChangePin');
    }
  }, [navigation]);

  React.useEffect(() => {
    if (hasPin) {
      feedback.dialog.alert(
        'PIN Sudah Aktif',
        'Akun Anda sudah memiliki PIN transaksi aktif. Anda akan dialihkan ke menu Ubah PIN.',
        handleRedirectToChangePin
      );
    }
  }, [hasPin, handleRedirectToChangePin]);

  const onSubmit = (data: SetupPinFormValues) => {
    setupPin(
      { pin: data.pin },
      {
        onSuccess: () => {
          feedback.dialog.success(
            'PIN Berhasil Dibuat',
            'PIN transaksi Anda telah aktif.',
            () => navigation.goBack()
          );
        },
        onError: (err: any) => {
          const errorMessage =
            err.response?.data?.message || err.message || 'Gagal mengatur PIN transaksi';
          feedback.dialog.error('Gagal Mengatur PIN', errorMessage);
        },
      }
    );
  };

  // GUARD: Jika PIN sudah aktif, cegah akses formulir pembuatan PIN perdana
  if (hasPin) {
    return (
      <UserLayout noPadding={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Kembali"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Aktivasi PIN</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.alreadySetCard}>
            <View style={styles.activeBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.activeBadgeText}>PIN Transaksi Aktif</Text>
            </View>

            <View style={styles.iconCircleLarge}>
              <Ionicons name="shield-checkmark" size={64} color={colors.primary} />
            </View>

            <Text style={styles.alreadySetTitle}>PIN Anda Telah Dikonfigurasi</Text>
            <Text style={styles.alreadySetSubtitle}>
              Akun Anda telah dilindungi dengan PIN transaksi 6 digit aktif. Anda tidak perlu melakukan aktivasi ulang.
            </Text>

            <View style={styles.infoDetailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status PIN</Text>
                <View style={styles.statusPill}>
                  <Ionicons name="lock-closed" size={13} color={colors.primary} />
                  <Text style={styles.statusPillText}>Aktif & Terenkripsi</Text>
                </View>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Proteksi</Text>
                <Text style={styles.detailValue}>Transfer & Penarikan Dana</Text>
              </View>
            </View>

            <ButtonCustom
              title="Buka Menu Ubah PIN"
              onPress={handleRedirectToChangePin}
              style={styles.redirectButton}
            />

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backLinkButton}
              accessibilityLabel="Kembali ke Profil"
              accessibilityRole="button"
            >
              <Text style={styles.backLinkText}>Kembali ke Profil</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </UserLayout>
    );
  }

  return (
    <UserLayout noPadding={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aktivasi PIN</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoBox}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Aktivasi PIN Transaksi</Text>
          <Text style={styles.subtitle}>
            PIN 6 digit digunakan untuk mengamankan setiap transaksi transfer dan penarikan saldo.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <ControlledInput
            control={control}
            name="pin"
            label="PIN Baru (6 Digit)"
            placeholder="6 Digit PIN"
            keyboardType="number-pad"
            maxLength={6}
            isPassword
          />

          <ControlledInput
            control={control}
            name="confirmPin"
            label="Konfirmasi PIN Baru"
            placeholder="Ketik ulang 6 Digit PIN"
            keyboardType="number-pad"
            maxLength={6}
            isPassword
          />

          <ButtonCustom
            title="Simpan & Aktifkan PIN"
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
  infoBox: {
    alignItems: 'center',
    marginVertical: spacing.xl,
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
    paddingHorizontal: spacing.lg,
  },
  formContainer: {
    marginTop: spacing.md,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  alreadySetCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radius.full,
    marginBottom: spacing.lg,
  },
  activeBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold as any,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  iconCircleLarge: {
    width: 96,
    height: 96,
    borderRadius: spacing.radius.full,
    backgroundColor: `${colors.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  alreadySetTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  alreadySetSubtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xl,
  },
  infoDetailsBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium as any,
    color: colors.textMain,
  },
  detailDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: spacing.radius.sm,
  },
  statusPillText: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: typography.weight.bold as any,
    marginLeft: 4,
  },
  redirectButton: {
    width: '100%',
    marginBottom: spacing.md,
  },
  backLinkButton: {
    paddingVertical: spacing.sm,
  },
  backLinkText: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    fontWeight: typography.weight.medium as any,
  },
});

export default SetupPinScreen;
