import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { UserLayout } from '@shared/layouts';
import { ControlledInput, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { useSetupPinMutation } from '../hooks/useUserData';

const setupPinSchema = z
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

type SetupPinFormValues = z.infer<typeof setupPinSchema>;

const SetupPinScreen = () => {
  const navigation = useNavigation<any>();
  const { mutate: setupPin, isPending } = useSetupPinMutation();

  const { control, handleSubmit } = useForm<SetupPinFormValues>({
    resolver: zodResolver(setupPinSchema),
    defaultValues: {
      pin: '',
      confirmPin: '',
    },
  });

  const onSubmit = (data: SetupPinFormValues) => {
    setupPin(
      { pin: data.pin },
      {
        onSuccess: () => {
          Alert.alert('PIN Berhasil Dibuat', 'PIN transaksi Anda telah aktif.', [
            { text: 'Selesai', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (err: any) => {
          const errorMessage =
            err.response?.data?.message || err.message || 'Gagal mengatur PIN transaksi';
          Alert.alert('Gagal Mengatur PIN', errorMessage);
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
});

export default SetupPinScreen;
