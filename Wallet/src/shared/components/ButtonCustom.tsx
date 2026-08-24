// import React from 'react';
// import { 
//   TouchableOpacity, 
//   Text, 
//   StyleSheet, 
//   ActivityIndicator, 
//   ViewStyle, 
//   TextStyle,
//   StyleProp
// } from 'react-native';
// import { colors } from '@theme/colors';
// import { typography } from '@theme/typography';
// import { spacing } from '../theme/spacing';


// // 1. Mendefinisikan Variasi Tombol yang Tersedia
// type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

// // 2. Kontrak Props TypeScript
// interface ButtonCustomProps {
//   title: string;
//   onPress: () => void;
//   variant?: ButtonVariant;
//   isLoading?: boolean;
//   disabled?: boolean;
//   style?: ViewStyle; 
// }

// const ButtonCustom = ({
//   title,
//   onPress,
//   variant = 'primary',
//   isLoading = false,
//   disabled = false,
//   style,
// }: ButtonCustomProps) => {
  
//   // Pola Clean Code: Kamus Pemetaan Gaya Tombol (Menghindari IF/ELSE panjang)
//   const variantStyles: Record<ButtonVariant, ViewStyle> = {
//     primary: { backgroundColor: colors.accent },
//     secondary: { backgroundColor: colors.primary },
//     outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
//     danger: { backgroundColor: colors.error },
//   };

//   // Pola Clean Code: Kamus Pemetaan Gaya Teks
//   const textStyles: Record<ButtonVariant, TextStyle> = {
//     primary: { color: colors.white },
//     secondary: { color: colors.white },
//     outline: { color: colors.primary },
//     danger: { color: colors.white },
//   };

//   // Mengambil gaya langsung dari kamus berdasarkan variasi yang dipilih (Evaluasi O(1) yang super cepat)
//   const getButtonStyles = (): StyleProp<ViewStyle> => {
//     const selectedVariantStyle = variantStyles[variant];
//     const stateStyle = (disabled || isLoading) ? styles.disabledButton : {};
//     return [styles.button, selectedVariantStyle, stateStyle, style];
//   };

//   const getTextStyles = (): StyleProp<TextStyle> => {
//     return [styles.text, textStyles[variant]];
//   };

//   return (
//     <TouchableOpacity
//       onPress={onPress}
//       disabled={disabled || isLoading}
//       activeOpacity={0.8}
//       style={getButtonStyles()}
//     >
//       {isLoading ? (
//         <ActivityIndicator 
//           size="small" 
//           color={variant === 'outline' ? colors.primary : colors.white} 
//         />
//       ) : (
//         <Text style={getTextStyles()}>{title}</Text>
//       )}
//     </TouchableOpacity>
//   );
// };

// // 3. Arsitektur Gaya Dasar Terpusat
// const styles = StyleSheet.create({
//   button: {
//     height: 48,
//     borderRadius: spacing.radius.md,
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: '100%',
//     marginVertical: spacing.sm,
//   },
//   disabledButton: {
//     opacity: 0.5,
//   },
//   text: {
//     fontSize: typography.size.md,
//     fontWeight: typography.weight.medium as any, 
//   },
// });

// export default ButtonCustom;

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
// Menggunakan Path Alias Baru ke Core Theme
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