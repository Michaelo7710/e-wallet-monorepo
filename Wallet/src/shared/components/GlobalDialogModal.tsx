import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@core/theme';
import { useFeedbackStore, FeedbackType } from '@core/feedback/feedback.store';

const { width } = Dimensions.get('window');

export const GlobalDialogModal: React.FC = () => {
  const dialog = useFeedbackStore((state) => state.dialog);
  const closeDialog = useFeedbackStore((state) => state.closeDialog);
  const [isProcessing, setIsProcessing] = React.useState(false);

  React.useEffect(() => {
    setIsProcessing(false);
  }, [dialog?.id]);

  if (!dialog || !dialog.isOpen) {
    return null;
  }

  const {
    id,
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText,
    isDestructive = false,
    onConfirm,
    onCancel,
  } = dialog;

  const handleConfirm = async () => {
    if (isProcessing) return;
    const currentDialogId = id;
    setIsProcessing(true);

    try {
      if (onConfirm) {
        await onConfirm();
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error saat mengeksekusi onConfirm dialog:', error);
      }
    } finally {
      setIsProcessing(false);
      closeDialog(currentDialogId);
    }
  };

  const handleCancel = async () => {
    if (isProcessing) return;
    const currentDialogId = id;
    setIsProcessing(true);

    try {
      if (onCancel) {
        await onCancel();
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error saat mengeksekusi onCancel dialog:', error);
      }
    } finally {
      setIsProcessing(false);
      closeDialog(currentDialogId);
    }
  };

  const getSemanticIcon = (feedbackType: FeedbackType) => {
    switch (feedbackType) {
      case 'success':
        return {
          name: 'checkmark-circle-outline' as const,
          color: colors.success,
          bg: '#ECFDF5',
        };
      case 'error':
        return {
          name: 'alert-circle-outline' as const,
          color: colors.error,
          bg: '#FEF2F2',
        };
      case 'warning':
        return {
          name: 'warning-outline' as const,
          color: colors.warning,
          bg: '#FFFBEB',
        };
      case 'info':
      default:
        return {
          name: 'information-circle-outline' as const,
          color: colors.primary,
          bg: '#D1FAE5',
        };
    }
  };

  const iconMeta = getSemanticIcon(type);

  return (
    <Modal
      transparent
      visible={dialog.isOpen}
      animationType="fade"
      onRequestClose={isProcessing ? undefined : handleCancel}
    >
      <TouchableWithoutFeedback onPress={isProcessing ? undefined : (cancelText ? handleCancel : handleConfirm)}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Semantic Icon Bubble */}
              <View style={[styles.iconBubble, { backgroundColor: iconMeta.bg }]}>
                <Ionicons name={iconMeta.name} size={36} color={iconMeta.color} />
              </View>

              {/* Title & Message */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {cancelText ? (
                  <TouchableOpacity
                    testID="dialog-cancel-button"
                    disabled={isProcessing}
                    style={[styles.cancelButton, isProcessing && styles.disabledButton]}
                    onPress={handleCancel}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  testID="dialog-confirm-button"
                  disabled={isProcessing}
                  style={[
                    styles.confirmButton,
                    isDestructive && styles.destructiveButton,
                    !cancelText && styles.fullWidthButton,
                    isProcessing && styles.disabledButton,
                  ]}
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmButtonText}>
                    {isProcessing ? 'Memproses...' : confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: Math.min(width - 48, 380),
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBubble: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.textMain,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  cancelButtonText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  destructiveButton: {
    backgroundColor: colors.error,
  },
  fullWidthButton: {
    flex: 1,
  },
  confirmButtonText: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
