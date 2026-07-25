import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

interface UserLayoutProps {
  children: React.ReactNode;
  // Prop opsional jika ada halaman (seperti Maps) yang ingin menyentuh ujung layar
  noPadding?: boolean; 
}

const UserLayout = ({ children, noPadding = false }: UserLayoutProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container, 
      { 
        // Mengamankan konten dari poni atas dan tombol navigasi virtual di bawah
        paddingTop: insets.top, 
        paddingBottom: Math.max(insets.bottom, spacing.md) 
      }
    ]}>
      {/* Status bar gelap karena background UserLayout kita berwarna terang */}
      <StatusBar style="dark" />
      
      <View style={[
        styles.content, 
        // Jika noPadding false, berikan jarak standar industri di sisi kiri-kanan
        !noPadding && { paddingHorizontal: spacing.lg }
      ]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Menerapkan Aturan 60% Warna Ruang
  },
  content: {
    flex: 1,
  },
});

export default UserLayout;