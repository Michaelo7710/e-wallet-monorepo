import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  TextInputProps 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Menggunakan ikon gratis dan efisien dari Expo
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

// Menggabungkan properti bawaan TextInput dengan fitur tambahan kita
interface InputFieldProps extends TextInputProps {
  label: string;
  error?: string; // Menerima pesan error dari React Hook Form atau Zod
  isPassword?: boolean; // Jika true, akan memunculkan ikon mata
}

const InputField = ({
  label,
  error,
  isPassword = false,
  style, // Mengizinkan styling tambahan dari luar untuk pembungkus (container)
  ...rest // Menangkap semua properti bawaan TextInput (seperti onChangeText, value, placeholder)
}: InputFieldProps) => {
  
  // State untuk mengontrol visibilitas password (hanya aktif jika isPassword = true)
  const [isSecure, setIsSecure] = useState(isPassword);
  // State untuk efek visual saat input sedang difokuskan (diketik)
  const [isFocused, setIsFocused] = useState(false);

  // Menentukan warna garis tepi (border) secara dinamis
  const getBorderColor = () => {
    if (error) return colors.error; // Jika ada error, garis jadi merah
    if (isFocused) return colors.primary; // Jika sedang diketik, garis jadi hijau zamrud
    return colors.border; // Kondisi normal, abu-abu tipis
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label Form */}
      <Text style={styles.label}>{label}</Text>

      {/* Kotak Input */}
      <View style={[styles.inputContainer, { borderColor: getBorderColor() }]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textLight}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest} // Menyuntikkan seluruh properti bawaan ke dalam komponen ini
        />

        {/* Ikon Toggle Mata (Khusus Password) */}
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

      {/* Pesan Error (Muncul hanya jika prop 'error' ada isinya) */}
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
    borderWidth: 1.5, // Garis lebih tebal agar lebih tegas dan modern
    borderRadius: 8,
    height: 50, // Ukuran ideal yang ramah jempol (Touch Target)
    paddingHorizontal: 14,
  },
  input: {
    flex: 1, // Mengisi seluruh ruang kosong yang tersedia
    height: '100%',
    color: colors.textMain,
    fontSize: typography.size.md,
  },
  eyeIcon: {
    paddingLeft: 10, // Memberi jarak antara teks dan ikon
  },
  errorText: {
    marginTop: 4,
    color: colors.error,
    fontSize: typography.size.xs,
  },
});

export default InputField;