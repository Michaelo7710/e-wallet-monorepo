import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { UserLayout } from '@shared/layouts';
import { colors, typography, spacing } from '@core/theme';
import { QUERY_KEYS } from '@core/network/queryKeys';

interface RouteParams {
  redirectUrl: string;
  referenceId?: string;
  amount?: number;
}

const SnapPaymentWebViewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { redirectUrl, referenceId, amount } = (route.params as RouteParams) || {};

  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [hasFinished, setHasFinished] = useState(false);

  const handleFinish = () => {
    if (hasFinished) return;
    setHasFinished(true);

    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER.PROFILE });
    queryClient.invalidateQueries({ queryKey: ['payment', 'history'] });

    Alert.alert(
      'Status Pembayaran',
      'Silakan cek mutasi saldo Anda. Jika pembayaran berhasil, saldo akan masuk secara otomatis.',
      [
        {
          text: 'Kembali ke Beranda',
          onPress: () => navigation.navigate('MainTab'),
        },
      ]
    );
  };

  const handleClose = () => {
    Alert.alert(
      'Tutup Pembayaran',
      'Apakah Anda yakin ingin keluar dari halaman pembayaran?',
      [
        { text: 'Lanjut Bayar', style: 'cancel' },
        {
          text: 'Tutup',
          style: 'destructive',
          onPress: handleFinish,
        },
      ]
    );
  };

  const handleNavigationStateChange = (navState: { url: string }) => {
    const url = navState.url.toLowerCase();
    if (
      url.includes('#finish') ||
      url.includes('status_code=200') ||
      url.includes('transaction_status=settlement') ||
      url.includes('transaction_status=capture') ||
      url.includes('status_code=201') ||
      url.includes('transaction_status=pending') ||
      url.includes('/payment/finish')
    ) {
      handleFinish();
    }
  };

  return (
    <UserLayout noPadding={true}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={24} color={colors.textMain} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Pembayaran Snap</Text>
          {referenceId ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Ref: {referenceId} {amount ? `(Rp ${amount.toLocaleString('id-ID')})` : ''}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.finishBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.finishBtnText}>Selesai</Text>
        </TouchableOpacity>
      </View>

      {/* WebView Body */}
      <View style={styles.webViewContainer}>
        {redirectUrl ? (
          <WebView
            source={{ uri: redirectUrl }}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onNavigationStateChange={handleNavigationStateChange}
            style={styles.webView}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
            <Text style={styles.emptyText}>Tautan pembayaran tidak valid.</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>Kembali</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && redirectUrl && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Memuat Gateway Pembayaran...</Text>
          </View>
        )}
      </View>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  headerSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  finishBtn: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radius.full,
  },
  finishBtnText: {
    color: colors.primary,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold as any,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.sm,
    color: colors.textMuted,
    fontWeight: typography.weight.medium as any,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.size.md,
    color: colors.textMuted,
    marginVertical: spacing.md,
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radius.md,
  },
  backBtnText: {
    color: colors.white,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold as any,
  },
});

export default SnapPaymentWebViewScreen;
