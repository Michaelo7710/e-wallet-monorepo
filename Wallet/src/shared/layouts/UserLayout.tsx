import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors, spacing } from '@core/theme';
import { useScreenGuard } from '@core/security/useScreenGuard';

interface UserLayoutProps {
  children: React.ReactNode;
  // Prop opsional jika ada halaman yang ingin menyentuh ujung layar
  noPadding?: boolean;
  // Anti-screenshot guard aktif secara default untuk melindungi data finansial & PII
  enableScreenGuard?: boolean;
}

const UserLayout = ({
  children,
  noPadding = false,
  enableScreenGuard = true,
}: UserLayoutProps) => {
  const insets = useSafeAreaInsets();

  // Menerapkan Anti-Screenshot Guard secara preventif di seluruh tampilan UserLayout
  useScreenGuard(enableScreenGuard);

  return (
    <View
      style={[
        styles.container,
        {
          // Mengamankan konten dari status bar atas dan navigation bar bawah
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      {/* Status bar gelap karena background UserLayout berwarna terang */}
      <StatusBar style="dark" />

      <View
        style={[
          styles.content,
          !noPadding && { paddingHorizontal: spacing.lg },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
});

export default UserLayout;