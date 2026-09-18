import React, { useState, useEffect } from 'react';
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
import {
  useUpdateEmailMutation,
  useRequestChangeEmailOtpMutation,
} from '../hooks/useUserData';

const changeEmailSchema = z.object({
  newEmail: z.string().email({ message: 'Format email baru tidak valid' }),
  pin: z
    .string()
    .length(6, { message: 'PIN transaksi harus 6 digit angka' })
    .regex(/^\d+$/, { message: 'PIN transaksi hanya boleh berisi angka' }),
  otp: z
    .string()
    .length(6, { message: 'Kode OTP/2FA harus 6 digit angka' })
    .regex(/^\d+$/, { message: 'Kode OTP hanya boleh berisi angka' }),
});

type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>;

const ChangeEmailScreen = () => {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);

  const [step, setStep] = useState<1 | 2>(1);
  const [resendTimer, setResendTimer] = useState<number>(0);

  const { mutate: updateEmail, isPending: isUpdating } = useUpdateEmailMutation();
  const { mutate: requestOtp, isPending: isRequestingOtp } = useRequestChangeEmailOtpMutation();

  const { control, handleSubmit, trigger, getValues } = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      newEmail: '',
      pin: '',
      otp: '',
    },
    mode: 'onTouched',
  });

  // Countdown timer untuk pengiriman ulang kode OTP
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    const isStep1Valid = await trigger(['newEmail', 'pin']);
    if (!isStep1Valid) return;

    const emailValue = getValues('newEmail');

    requestOtp(emailValue, {
      onSuccess: (res: any) => {
        setStep(2);
        setResendTimer(60);
        if (res?.twoFactor || user?.twoFactorEnabled) {
          feedback.toast.info('Akun dilindungi 2FA. Gunakan kode dari aplikasi autentikator.');
        } else {
          feedback.toast.success(res?.message || 'Kode OTP telah dikirimkan ke email baru Anda.');
        }
      },
      onError: (err: any) => {
        const errorMessage =
          err.response?.data?.message || err.message || 'Gagal mengirimkan kode OTP';
        feedback.dialog.error('Gagal Mengirim OTP', errorMessage);
      },
    });
  };

  const handleResendOtp = () => {
    if (resendTimer > 0 || isRequestingOtp) return;
    const emailValue = getValues('newEmail');
    requestOtp(emailValue, {
      onSuccess: (res: any) => {
        setResendTimer(60);
        feedback.toast.success(res?.message || 'Kode OTP baru berhasil dikirimkan!');
      },
      onError: (err: any) => {
        const errorMessage =
          err.response?.data?.message || err.message || 'Gagal mengirim ulang kode OTP';
        feedback.dialog.error('Gagal Mengirim Ulang', errorMessage);
      },
    });
  };

  const onSubmit = (data: ChangeEmailFormValues) => {
    updateEmail(
      {
        newEmail: data.newEmail,
        otp: data.otp,
        pin: data.pin,
      },
      {
        onSuccess: () => {
          feedback.dialog.success(
            'Email Berhasil Diperbarui',
            `Alamat email akun Anda resmi diperbarui menjadi ${data.newEmail}.`,
            () => navigation.goBack()
          );
        },
        onError: (err: any) => {
          const errorMessage =
            err.response?.data?.message || err.message || 'Gagal memperbarui email';
          feedback.dialog.error('Gagal Memperbarui Email', errorMessage);
        },
      }
    );
  };

  const handleBackPress = () => {
    if (step === 2) {
      setStep(1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <UserLayout noPadding={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
          accessibilityLabel="Kembali"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ubah Alamat Email</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step Indicator */}
        <View style={styles.stepContainer}>
          <View style={[styles.stepBadge, step === 1 ? styles.stepBadgeActive : styles.stepBadgeDone]}>
            {step === 2 ? (
              <Ionicons name="checkmark" size={14} color={colors.surface} />
            ) : (
              <Text style={[styles.stepNumber, step === 1 && styles.stepNumberActive]}>1</Text>
            )}
            <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>Email & PIN</Text>
          </View>

          <View style={[styles.stepConnector, step === 2 && styles.stepConnectorActive]} />

          <View style={[styles.stepBadge, step === 2 ? styles.stepBadgeActive : styles.stepBadgePending]}>
            <Text style={[styles.stepNumber, step === 2 && styles.stepNumberActive]}>2</Text>
            <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>Verifikasi OTP</Text>
          </View>
        </View>

        {step === 1 ? (
          /* STEP 1: Input Email Baru & PIN */
          <View style={styles.stepContent}>
            <View style={styles.infoBox}>
              <Text style={styles.stepTitle}>Langkah 1: Kredensial Baru</Text>
              <Text style={styles.subtitle}>
                Masukkan alamat email baru yang akan didaftarkan beserta PIN transaksi 6-digit akun Anda untuk otorisasi keamanan.
              </Text>
            </View>

            <View style={styles.formContainer}>
              <ControlledInput
                control={control}
                name="newEmail"
                label="Alamat Email Baru"
                placeholder="nama@domain.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <ControlledInput
                control={control}
                name="pin"
                label="PIN Transaksi"
                placeholder="6 Digit PIN Keamanan"
                keyboardType="number-pad"
                maxLength={6}
                isPassword
              />

              <ButtonCustom
                title="Kirim Kode OTP"
                onPress={handleSendOtp}
                isLoading={isRequestingOtp}
                style={styles.actionButton}
              />
            </View>
          </View>
        ) : (
          /* STEP 2: Input OTP & Konfirmasi */
          <View style={styles.stepContent}>
            <View style={styles.infoBox}>
              <Text style={styles.stepTitle}>Langkah 2: Verifikasi OTP</Text>
              <Text style={styles.subtitle}>
                {user?.twoFactorEnabled
                  ? 'Buka aplikasi autentikator (Google Authenticator / 2FA) Anda dan masukkan kode 6-digit.'
                  : `Kode verifikasi telah dikirimkan ke email baru Anda: ${getValues('newEmail')}. Masukkan 6 digit kode untuk finalisasi.`}
              </Text>
            </View>

            <View style={styles.emailSummaryCard}>
              <Ionicons name="mail-outline" size={24} color={colors.primary} style={styles.summaryIcon} />
              <View style={styles.summaryTextWrapper}>
                <Text style={styles.summaryCaption}>Email Baru Tujuan</Text>
                <Text style={styles.summaryValue}>{getValues('newEmail')}</Text>
              </View>
            </View>

            <View style={styles.formContainer}>
              <ControlledInput
                control={control}
                name="otp"
                label="Kode OTP / Token 2FA"
                placeholder="6 Digit OTP"
                keyboardType="number-pad"
                maxLength={6}
              />

              <ButtonCustom
                title="Konfirmasi Pembaruan Email"
                onPress={handleSubmit(onSubmit)}
                isLoading={isUpdating}
                style={styles.actionButton}
              />

              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={resendTimer > 0 || isRequestingOtp}
                  style={styles.resendButton}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={16}
                    color={resendTimer > 0 ? colors.textMuted : colors.primary}
                  />
                  <Text
                    style={[
                      styles.resendText,
                      resendTimer > 0 && styles.resendTextDisabled,
                    ]}
                  >
                    {resendTimer > 0 ? `Kirim ulang OTP (${resendTimer}s)` : 'Kirim Ulang OTP'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStep(1)}
                  style={styles.changeInfoButton}
                >
                  <Text style={styles.changeInfoText}>Ubah Email atau PIN</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.xs,
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
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  stepBadgeActive: {
    backgroundColor: colors.primary,
  },
  stepBadgeDone: {
    backgroundColor: colors.success || '#10b981',
  },
  stepBadgePending: {
    backgroundColor: colors.border || '#e2e8f0',
  },
  stepNumber: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold as any,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  stepNumberActive: {
    color: colors.surface,
  },
  stepLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium as any,
    color: colors.textMuted,
  },
  stepLabelActive: {
    color: colors.surface,
    fontWeight: typography.weight.bold as any,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border || '#e2e8f0',
    marginHorizontal: spacing.xs,
  },
  stepConnectorActive: {
    backgroundColor: colors.primary,
  },
  stepContent: {
    marginTop: spacing.xs,
  },
  infoBox: {
    marginVertical: spacing.sm,
  },
  stepTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  emailSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border || '#e2e8f0',
    marginBottom: spacing.md,
  },
  summaryIcon: {
    marginRight: spacing.md,
  },
  summaryTextWrapper: {
    flex: 1,
  },
  summaryCaption: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  formContainer: {
    marginTop: spacing.xs,
  },
  actionButton: {
    marginTop: spacing.lg,
  },
  secondaryActions: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  resendText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium as any,
    color: colors.primary,
  },
  resendTextDisabled: {
    color: colors.textMuted,
  },
  changeInfoButton: {
    paddingVertical: spacing.xs,
  },
  changeInfoText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});

export default ChangeEmailScreen;
