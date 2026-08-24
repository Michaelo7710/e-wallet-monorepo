import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '@core/theme';

interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string;
  isPassword?: boolean;
}

const InputField = ({
  label,
  error,
  isPassword = false,
  style,
  ...rest
}: InputFieldProps) => {
  const [isSecure, setIsSecure] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, { borderColor: getBorderColor() }]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textLight}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={styles.eyeIcon}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isSecure ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  label: {
    fontSize: typography.size.sm,
    color: colors.textMain,
    fontWeight: typography.weight.medium as any,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    color: colors.textMain,
    fontSize: typography.size.md,
  },
  eyeIcon: {
    paddingLeft: 10,
  },
  errorText: {
    marginTop: 4,
    color: colors.error,
    fontSize: typography.size.xs,
  },
});

export default InputField;