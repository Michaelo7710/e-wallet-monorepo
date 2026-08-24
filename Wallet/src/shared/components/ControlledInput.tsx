import React from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { TextInputProps } from 'react-native';
import InputField from './InputField';

// 1. Kontrak Data Fleksibel (Generics)
// TFieldValues memastikan komponen ini bisa beradaptasi dengan skema Zod apapun
interface ControlledInputProps<TFieldValues extends FieldValues> extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  name: Path<TFieldValues>; // Nama field harus sesuai dengan skema Zod (misal: 'email' atau 'password')
  control: Control<TFieldValues>; // "Remot kontrol" dari React Hook Form
  label: string;
  isPassword?: boolean;
}

const ControlledInput = <TFieldValues extends FieldValues>({
  name,
  control,
  label,
  isPassword,
  style,
  ...rest
}: ControlledInputProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name}
      // 2. Render Prop Pattern (Pemisahan Logika dan UI)
      render={({ 
        field: { onChange, onBlur, value }, 
        fieldState: { error } 
      }) => (
        <InputField
          label={label}
          isPassword={isPassword}
          // Mengawinkan fungsi RHF dengan InputField UI kita
          onChangeText={onChange} 
          onBlur={onBlur}
          value={value}
          // Mengirim pesan error Zod secara dinamis (jika ada)
          error={error?.message} 
          style={style}
          {...rest}
        />
      )}
    />
  );
};

export default ControlledInput;