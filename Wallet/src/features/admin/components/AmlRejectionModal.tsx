import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@core/theme';
import ButtonCustom from '@shared/components/ButtonCustom';
import InputField from '@shared/components/InputField';

export interface AmlRejectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (structuredReason: string) => void;
  isLoading?: boolean;
  transactionReference?: string;
}

export const AML_REJECTION_CATEGORIES = [
  { id: 'FRAUD_SUSPICION', label: 'Indikasi Transaksi Mencurigakan / Fraud' },
  { id: 'KYC_MISMATCH', label: 'Ketidaksesuaian Profil & Identitas KYC' },
  { id: 'SANCTION_LIST', label: 'Terindikasi Daftar Hitam / DTTOT' },
  { id: 'LAW_ENFORCEMENT', label: 'Instruksi Regulator / Penegak Hukum' },
  { id: 'OTHER', label: 'Alasan Operasional / Catatan Khusus' },
] as const;

export type AmlRejectionCategoryId = (typeof AML_REJECTION_CATEGORIES)[number]['id'];

export const AmlRejectionModal = ({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  transactionReference,
}: AmlRejectionModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<AmlRejectionCategoryId | null>(null);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (!visible) {
      setSelectedCategory(null);
      setNotes('');
    }
  }, [visible]);

  const isNotesValid =
    selectedCategory === 'OTHER' ? notes.trim().length >= 10 : notes.trim().length > 0;
  const isSubmitDisabled = !selectedCategory || !isNotesValid || isLoading;

  const notesError =
    selectedCategory === 'OTHER' && notes.trim().length > 0 && notes.trim().length < 10
      ? 'Catatan investigasi minimal 10 karakter untuk alasan operasional / non-standar.'
      : undefined;

  const handleSubmit = () => {
    if (isSubmitDisabled || !selectedCategory) return;
    const structuredReason = `[${selectedCategory}] ${notes.trim()}`;
    onSubmit(structuredReason);
  };

  const handleClose = () => {
    if (isLoading) return;
    setSelectedCategory(null);
    setNotes('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View
            style={styles.dialogCard}
            accessible={true}
            accessibilityRole={'alertdialog' as any}
            accessibilityLabel="Dialog Kepatuhan AML Penolakan Transfer"
          >
            {/* Header */}
            <View style={styles.dialogHeader}>
              <View style={styles.titleRow}>
                <View style={styles.shieldIconWrapper}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.error} />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Kepatuhan AML & Tolak Transfer</Text>
                  {transactionReference ? (
                    <Text style={styles.refText}>Ref: {transactionReference}</Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                disabled={isLoading}
                style={styles.closeBtn}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Tutup dialog penolakan"
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.instruction}>
                Pilih kategori pelanggaran kepatuhan Anti-Money Laundering (AML) dan masukkan catatan
                hasil audit investigasi sebelum membatalkan transfer dan memulangkan dana ke pengirim.
              </Text>

              {/* Taxonomy Categories */}
              <Text style={styles.sectionLabel}>Kategori Pelanggaran Kepatuhan</Text>
              <View style={styles.categoryList}>
                {AML_REJECTION_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                      onPress={() => setSelectedCategory(cat.id)}
                      disabled={isLoading}
                      activeOpacity={0.7}
                      accessible={true}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`Kategori: ${cat.label}`}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Investigative Notes Input */}
              <View style={styles.inputSection}>
                <InputField
                  label="Catatan Hasil Investigasi"
                  placeholder="Masukkan rincian temuan investigasi kepatuhan AML..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline={true}
                  numberOfLines={4}
                  editable={!isLoading}
                  error={notesError}
                  accessibilityHint="Masukkan rincian temuan investigasi kepatuhan AML"
                />
                {selectedCategory === 'OTHER' && (
                  <Text style={styles.helperText}>
                    * Alasan operasional/khusus mewajibkan minimal 10 karakter catatan investigasi.
                  </Text>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionContainer}>
                <ButtonCustom
                  title="Konfirmasi Tolak & Refund"
                  variant="danger"
                  onPress={handleSubmit}
                  isLoading={isLoading}
                  disabled={isSubmitDisabled}
                />
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleClose}
                  disabled={isLoading}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Batal dan tutup dialog"
                >
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  keyboardAvoid: {
    width: '100%',
    maxWidth: 480,
  },
  dialogCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  shieldIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: spacing.radius.full,
    backgroundColor: `${colors.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  refText: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  scrollContent: {
    paddingVertical: spacing.xs,
  },
  instruction: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMain,
    marginBottom: spacing.xs,
  },
  categoryList: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChipSelected: {
    backgroundColor: `${colors.error}10`,
    borderColor: colors.error,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.8,
    borderColor: colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.error,
  },
  radioInnerDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.error,
  },
  categoryChipText: {
    fontSize: typography.size.xs,
    color: colors.textMain,
    flex: 1,
    lineHeight: 16,
  },
  categoryChipTextSelected: {
    color: colors.error,
    fontWeight: typography.weight.semibold as any,
  },
  inputSection: {
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: typography.size.xs,
    color: colors.warning,
    marginTop: -4,
    marginBottom: spacing.xs,
  },
  actionContainer: {
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    fontWeight: typography.weight.medium as any,
  },
});

export default AmlRejectionModal;
