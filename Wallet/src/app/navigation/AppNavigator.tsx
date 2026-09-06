import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@core/storage/useAuthStore';
import { colors } from '@core/theme';
import { deviceIntegrityService } from '@core/security/deviceIntegrity.service';
import { DeviceSecurityBlockedScreen } from '@shared/components';
import { telemetryService } from '@core/telemetry/telemetry.service';

import AuthStack from './AuthStack';
import UserStack from './UserStack';
import AdminStack from './AdminStack';

const AppNavigator = () => {
  const { isAuthenticated, isLoading, user, hydrate } = useAuthStore();
  const [isDeviceBlocked, setIsDeviceBlocked] = useState<boolean>(false);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState<boolean>(true);
  const [blockReasons, setBlockReasons] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSecurityAndAuth = async () => {
      try {
        // 1. Verifikasi Integritas Perangkat Sebelum Membaca Token / Hidrasi Sesi
        const integrityResult = await deviceIntegrityService.checkDeviceIntegrity();

        if (!isMounted) return;

        if (integrityResult.isCompromised) {
          setIsDeviceBlocked(true);
          setBlockReasons(integrityResult.reasons);
          telemetryService.captureMessage(
            'Perangkat terblokir karena modifikasi sistem.',
            'error'
          );
          setIsCheckingIntegrity(false);
          return; // Hentikan proses hidrasi token sesi (Zero-Trust)
        }

        setIsCheckingIntegrity(false);
        await hydrate();
      } catch (error) {
        if (!isMounted) return;
        console.warn('[APP_NAVIGATOR] Pemeriksaan integritas perangkat gagal/timeout:', error);
        setIsCheckingIntegrity(false);
        await hydrate();
      }
    };

    bootstrapSecurityAndAuth();

    return () => {
      isMounted = false;
    };
  }, [hydrate]);

  // Jika perangkat terdeteksi telah di-root, jailbreak, atau terinjeksi hook
  if (isDeviceBlocked) {
    return <DeviceSecurityBlockedScreen reasons={blockReasons} />;
  }

  // Tampilkan loading screen sementara saat memeriksa integritas atau membaca sesi
  if (isCheckingIntegrity || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : user?.role === 'admin' ? (
        <AdminStack />
      ) : (
        <UserStack />
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default AppNavigator;