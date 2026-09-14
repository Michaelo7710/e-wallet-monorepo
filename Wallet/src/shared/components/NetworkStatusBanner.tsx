import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '@core/network/networkListener';
import { colors, typography, spacing } from '@core/theme';

export const NetworkStatusBanner = () => {
  const insets = useSafeAreaInsets();
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = isConnected === false || isInternetReachable === false;

  const [visible, setVisible] = useState<boolean>(false);
  const [isRestored, setIsRestored] = useState<boolean>(false);
  const wasOffline = useRef<boolean>(false);
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;

    if (isOffline) {
      wasOffline.current = true;
      setIsRestored(false);
      setVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (wasOffline.current) {
      // Pemulihan koneksi: tampilkan indikator kembali online selama 2 detik sebelum keluar
      setIsRestored(true);
      hideTimer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -60,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setVisible(false);
          setIsRestored(false);
          wasOffline.current = false;
        });
      }, 2000);
    }

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [isOffline, slideAnim, opacityAnim]);

  if (!visible) return null;

  const backgroundColor = isRestored ? colors.success : colors.warning;
  const message = isRestored
    ? 'Kembali Online • Menyinkronkan...'
    : 'Koneksi Terputus • Mode Offline';
  const iconName = isRestored ? 'cloud-done-outline' : 'cloud-offline-outline';

  return (
    <Animated.View
      style={[
        styles.bannerContainer,
        {
          paddingTop: Math.max(insets.top, spacing.xs) + 4,
          backgroundColor,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      accessibilityLabel={message}
    >
      <View style={styles.contentRow}>
        <Ionicons
          name={iconName}
          size={16}
          color={colors.white}
          style={styles.icon}
        />
        <Text style={styles.bannerText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.xs,
  },
  bannerText: {
    color: colors.white,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold as any,
  },
});

export default NetworkStatusBanner;
