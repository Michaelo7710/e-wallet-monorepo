import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@core/theme';

interface PinModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
}

const PIN_LENGTH = 6;

const PinModal = ({
  visible,
  onClose,
  onSubmit,
  title = 'Masukkan PIN Transaksi',
  subtitle = 'PIN 6 digit diperlukan untuk mengamankan transaksi',
  isLoading = false,
}: PinModalProps) => {
  const [pin, setPin] = useState<string>('');

  useEffect(() => {
    if (!visible) {
      setPin('');
    }
  }, [visible]);

  const handleKeyPress = (num: string) => {
    if (isLoading) return;
    if (pin.length < PIN_LENGTH) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === PIN_LENGTH) {
        onSubmit(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (isLoading) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < PIN_LENGTH; i++) {
      const isFilled = i < pin.length;
      dots.push(
        <View
          key={i}
          style={[styles.dot, isFilled && styles.dotFilled]}
        />
      );
    }
    return <View style={styles.dotsContainer}>{dots}</View>;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={isLoading}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {renderDots()}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Memproses Transaksi...</Text>
            </View>
          ) : (
            <View style={styles.keypad}>
              <View style={styles.keypadRow}>
                {['1', '2', '3'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.keypadButton}
                    onPress={() => handleKeyPress(num)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.keypadText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                {['4', '5', '6'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.keypadButton}
                    onPress={() => handleKeyPress(num)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.keypadText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                {['7', '8', '9'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={styles.keypadButton}
                    onPress={() => handleKeyPress(num)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.keypadText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                <View style={styles.keypadEmpty} />
                <TouchableOpacity
                  style={styles.keypadButton}
                  onPress={() => handleKeyPress('0')}
                  activeOpacity={0.6}
                >
                  <Text style={styles.keypadText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keypadButton}
                  onPress={handleDelete}
                  activeOpacity={0.6}
                >
                  <Ionicons name="backspace-outline" size={26} color={colors.textMain} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: spacing.radius.lg,
    borderTopRightRadius: spacing.radius.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginVertical: spacing.xl,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  loadingContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  keypad: {
    width: '100%',
    marginTop: spacing.md,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.sm,
  },
  keypadButton: {
    width: 72,
    height: 72,
    borderRadius: spacing.radius.full,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadEmpty: {
    width: 72,
    height: 72,
  },
  keypadText: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMain,
  },
});

export default PinModal;