import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { colors, typography, spacing } from '@core/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonCustomProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const ButtonCustom = ({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
}: ButtonCustomProps) => {
  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: colors.accent },
    secondary: { backgroundColor: colors.primary },
    outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
    danger: { backgroundColor: colors.error },
  };

  const textStyles: Record<ButtonVariant, TextStyle> = {
    primary: { color: colors.white },
    secondary: { color: colors.white },
    outline: { color: colors.primary },
    danger: { color: colors.white },
  };

  const getButtonStyles = (): StyleProp<ViewStyle> => {
    const selectedVariantStyle = variantStyles[variant];
    const stateStyle = disabled || isLoading ? styles.disabledButton : {};
    return [styles.button, selectedVariantStyle, stateStyle, style];
  };

  const getTextStyles = (): StyleProp<TextStyle> => {
    return [styles.text, textStyles[variant]];
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      style={getButtonStyles()}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      accessibilityHint={isLoading ? 'Sedang memproses tindakan...' : undefined}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? colors.primary : colors.white}
        />
      ) : (
        <Text style={getTextStyles()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: spacing.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: spacing.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium as any,
  },
});

export default ButtonCustom;