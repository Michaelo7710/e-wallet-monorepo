import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { UserLayout } from '@shared/layouts';
import { ControlledInput, ButtonCustom } from '@shared/components';
import { colors, typography, spacing } from '@core/theme';
import { AdminBank } from '@domain/repositories/admin.repository.interface';
import {
  useAdminBanks,
  useCreateBankMutation,
  useUpdateBankMutation,
  useDeleteBankMutation,
} from '../hooks/useAdminData';

const bankSchema = z.object({
  bank_name: z.string().min(2, 'Nama bank wajib diisi (min. 2 karakter)'),
  account_number: z
    .string()
    .min(5, 'Nomor rekening minimal 5 digit')
    .regex(/^\d+$/, 'Nomor rekening harus berupa angka'),
  account_name: z.string().min(3, 'Nama pemilik rekening minimal 3 karakter'),
});

type BankFormValues = z.infer<typeof bankSchema>;

const AdminBankManagementScreen = () => {
  const navigation = useNavigation();
  const { data: banks, isLoading, refetch, isRefetching } = useAdminBanks();
  const { mutate: createBank, isPending: isCreating } = useCreateBankMutation();
  const { mutate: updateBank, isPending: isUpdating } = useUpdateBankMutation();
  const { mutate: deleteBank, isPending: isDeleting } = useDeleteBankMutation();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBank, setSelectedBank] = useState<AdminBank | null>(null);

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<BankFormValues>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bank_name: '',
      account_number: '',
      account_name: '',
    },
  });

  const handleOpenCreate = () => {
    setSelectedBank(null);
    reset({
      bank_name: '',
      account_number: '',
      account_name: '',
    });
    setIsModalVisible(true);
  };

  const handleOpenEdit = (bank: AdminBank) => {
    setSelectedBank(bank);
    reset({
      bank_name: bank.bankName,
      account_number: bank.accountNumber,
      account_name: bank.accountName,
    });
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedBank(null);
    reset({
      bank_name: '',
      account_number: '',
      account_name: '',
    });
  };

  const onSubmit = (data: BankFormValues) => {
    if (selectedBank) {
      updateBank(
        { id: selectedBank.id, payload: data },
        {
          onSuccess: () => {
            Alert.alert('Sukses', 'Data rekening master berhasil diperbarui.');
            handleCloseModal();
          },
          onError: (err: any) => {
            Alert.alert(
              'Gagal',
              err.response?.data?.message || err.message || 'Gagal memperbarui rekening'
            );
          },
        }
      );
    } else {
      createBank(data, {
        onSuccess: () => {
          Alert.alert('Sukses', 'Rekening master baru berhasil didaftarkan.');
          handleCloseModal();
        },
        onError: (err: any) => {
          Alert.alert(
            'Gagal',
            err.response?.data?.message || err.message || 'Gagal menambahkan rekening'
          );
        },
      });
    }
  };

  const handleDelete = (bank: AdminBank) => {
    Alert.alert(
      'Hapus Rekening',
      `Apakah Anda yakin ingin menghapus rekening ${bank.bankName} - ${bank.accountNumber}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            deleteBank(bank.id, {
              onSuccess: () => Alert.alert('Sukses', 'Rekening master berhasil dihapus.'),
              onError: (err: any) =>
                Alert.alert(
                  'Gagal',
                  err.response?.data?.message || err.message || 'Gagal menghapus rekening'
                ),
            });
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: AdminBank }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.bankBadge}>
          <Ionicons name="business" size={18} color={colors.primary} />
          <Text style={styles.bankName}>{item.bankName}</Text>
        </View>
        <Text style={styles.accountNumber}>{item.accountNumber}</Text>
        <Text style={styles.accountName}>a.n. {item.accountName}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionBtnEdit}
          onPress={() => handleOpenEdit(item)}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtnDelete}
          onPress={() => handleDelete(item)}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <UserLayout noPadding={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rekening Master Bank</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleOpenCreate}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={banks ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="card-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>Belum ada rekening master terdaftar.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal Form */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedBank ? 'Edit Rekening Master' : 'Tambah Rekening Master'}
              </Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={colors.textMain} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <ControlledInput
                name="bank_name"
                control={control}
                label="Nama Bank"
                placeholder="Contoh: BCA, Mandiri, BRI"
                autoCapitalize="characters"
              />

              <ControlledInput
                name="account_number"
                control={control}
                label="Nomor Rekening"
                placeholder="Contoh: 1234567890"
                keyboardType="number-pad"
              />

              <ControlledInput
                name="account_name"
                control={control}
                label="Nama Pemilik Rekening"
                placeholder="Sesuai buku tabungan"
                autoCapitalize="characters"
              />

              <ButtonCustom
                title={selectedBank ? 'Simpan Perubahan' : 'Tambah Rekening'}
                onPress={handleSubmit(onSubmit)}
                isLoading={isCreating || isUpdating}
                style={styles.modalSubmitBtn}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: spacing.radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.size.md,
    color: colors.textMuted,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.radius.lg,
    marginBottom: spacing.md,
    elevation: 2,
  },
  cardLeft: {
    flex: 1,
  },
  bankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bankName: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  accountNumber: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold as any,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  accountName: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionBtnEdit: {
    width: 40,
    height: 40,
    borderRadius: spacing.radius.md,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnDelete: {
    width: 40,
    height: 40,
    borderRadius: spacing.radius.md,
    backgroundColor: `${colors.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: spacing.radius.lg,
    borderTopRightRadius: spacing.radius.lg,
    padding: spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  modalSubmitBtn: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});

export default AdminBankManagementScreen;
