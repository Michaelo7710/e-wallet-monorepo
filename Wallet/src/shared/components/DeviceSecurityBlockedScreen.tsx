import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  BackHandler,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@core/theme';
import ButtonCustom from './ButtonCustom';

export interface DeviceSecurityBlockedScreenProps {
  reasons?: string[];
}

export const DeviceSecurityBlockedScreen = ({
  reasons = [],
}: DeviceSecurityBlockedScreenProps) => {
  const handleExitApp = () => {
    if (Platform.OS === 'android') {
      BackHandler.exitApp();
    } else {
      Alert.alert(
        'Keluar Aplikasi',
        'Silakan tekan tombol Home atau geser layar ke atas untuk menutup GreenPay demi keamanan data Anda.',
        [{ text: 'Mengerti' }]
      );
    }
  };

  /**
   * Sanitasi alasan keamanan agar informatif namun tidak membocorkan detail implementasi internal
   */
  const sanitizeReason = (reason: string): string => {
    const lower = reason.toLowerCase();
    if (lower.includes('biner') || lower.includes('root') || lower.includes('su') || lower.includes('jailbreak')) {
      return 'Modifikasi berkas sistem operasi terdeteksi (Root / Jailbreak).';
    }
    if (lower.includes('frida') || lower.includes('xposed') || lower.includes('injeksi') || lower.includes('manipulasi')) {
      return 'Instrumen injeksi kode memori dinamis atau debugger terdeteksi.';
    }
    if (lower.includes('test-keys') || lower.includes('firmware')) {
      return 'Firmware tidak resmi atau image sistem modifikasi terdeteksi.';
    }
    if (lower.includes('emulator')) {
      return 'Perangkat virtual / emulator tidak diizinkan pada lingkungan ini.';
    }
    return 'Penyimpangan integritas keamanan perangkat terdeteksi.';
  };

  const displayReasons = Array.from(new Set(reasons.map(sanitizeReason)));

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel="Layar Pemblokiran Keamanan Perangkat"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="shield-half-outline" size={72} color={colors.error} />
        </View>

        <Text style={styles.title}>Perangkat Tidak Memenuhi Standar Keamanan</Text>

        <Text style={styles.description}>
          GreenPay mendeteksi bahwa sistem operasi perangkat ini telah dimodifikasi
          (Root/Jailbreak/Injeksi Sistem). Demi melindungi dana dan data privasi nasabah, aplikasi
          tidak dapat dijalankan pada perangkat ini.
        </Text>

        {displayReasons.length > 0 && (
          <View style={styles.reasonsContainer}>
            <Text style={styles.reasonsHeader}>Detail Indikasi Keamanan:</Text>
            {displayReasons.map((item, idx) => (
              <View key={idx} style={styles.reasonRow}>
                <Ionicons name="alert-circle" size={16} color={colors.error} style={styles.reasonIcon} />
                <Text style={styles.reasonText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <ButtonCustom
            title="Keluar Aplikasi"
            variant="danger"
            onPress={handleExitApp}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: spacing.radius.full,
    backgroundColor: `${colors.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: typography.lineHeight.normal,
    marginBottom: spacing.xl,
  },
  reasonsContainer: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
    marginBottom: spacing.xl,
  },
  reasonsHeader: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold as any,
    color: colors.error,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  reasonIcon: {
    marginTop: 2,
    marginRight: spacing.xs,
  },
  reasonText: {
    flex: 1,
    fontSize: typography.size.xs,
    color: colors.textMain,
    lineHeight: 18,
  },
  footer: {
    width: '100%',
    marginTop: spacing.md,
  },
});

export default DeviceSecurityBlockedScreen;
