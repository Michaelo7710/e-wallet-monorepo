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
import { useUpdatePasswordMutation } from '../hooks/useUserData';

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, { message: 'Password lama wajib diisi' }),
    newPassword: z.string().min(8, { message: 'Password baru minimal 8 karakter' }),
    confirmNewPassword: z.string().min(8, { message: 'Konfirmasi password minimal 8 karakter' }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Konfirmasi password baru tidak cocok',
    path: ['confirmNewPassword'],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

const ChangePasswordScreen = () => {
  const navigation = useNavigation<any>();
  const { mutate: updatePassword, isPending } = useUpdatePasswordMutation();

  const { control, handleSubmit } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = (data: ChangePasswordFormValues) => {
    updatePassword(
      {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      },
      {
        onSuccess: () => {
          Alert.alert('Sukses', 'Kata sandi akun Anda berhasil diperbarui.', [
            { text: 'Kembali', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (err: any) => {
          const errorMessage =
            err.response?.data?.message || err.message || 'Gagal mengubah kata sandi';
          Alert.alert('Gagal Mengubah Sandi', errorMessage);
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
        <Text style={styles.headerTitle}>Ubah Kata Sandi</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.infoBox}>
          <Text style={styles.subtitle}>
            Pastikan kata sandi baru Anda kuat dan tidak mudah ditebak.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <ControlledInput
            control={control}
            name="oldPassword"
            label="Kata Sandi Lama"
            placeholder="Masukkan kata sandi lama"
            isPassword
          />

          <ControlledInput
            control={control}
            name="newPassword"
            label="Kata Sandi Baru (Min. 8 Karakter)"
            placeholder="Masukkan kata sandi baru"
            isPassword
          />

          <ControlledInput
            control={control}
            name="confirmNewPassword"
            label="Konfirmasi Sandi Baru"
            placeholder="Ketik ulang kata sandi baru"
            isPassword
          />

          <ButtonCustom
            title="Simpan Kata Sandi"
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
    marginVertical: spacing.md,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  formContainer: {
    marginTop: spacing.md,
  },
  submitButton: {
    marginTop: spacing.lg,
  },
});

export default ChangePasswordScreen;
