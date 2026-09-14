/**
 * GreenPay Global Error Boundary (Emergency Fallback Screen)
 * 
 * Menangkap seluruh uncaught render / runtime error pada pohon komponen React Native.
 * Mencegah aplikasi force-close mendadak (Crash Prevention) dan menyajikan UI pemulihan
 * elegan yang menampilkan ID Pelacakan (Correlation ID) untuk pelaporan ke Customer Support.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@core/theme';
import { telemetryService } from './telemetry.service';

export interface GlobalErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

export interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  correlationId: string | null;
}

export class GlobalErrorBoundary extends Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      correlationId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<GlobalErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const correlationId = telemetryService.getCorrelationId();

    telemetryService.captureException(error, {
      componentStack: errorInfo.componentStack,
    });

    this.setState({ correlationId });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      correlationId: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleCopyCorrelationId = (): void => {
    const id = this.state.correlationId || 'N/A';
    Alert.alert(
      'ID Pelacakan Tersedia',
      `ID Referensi Tiket CS:\n${id}\n\nSilakan salin ID ini untuk dilaporkan ke Customer Care GreenPay.`,
      [{ text: 'Mengerti', style: 'default' }]
    );
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const trackingId = this.state.correlationId || 'N/A';

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ScrollView
          contentContainerStyle={styles.container}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Ikon Peringatan Sistem */}
          <View style={styles.iconWrapper}>
            <Ionicons name="warning-outline" size={72} color={colors.error} />
          </View>

          {/* Judul & Subjudul */}
          <Text style={styles.title}>Terjadi Kendala Sistem</Text>
          <Text style={styles.subtitle}>
            Aplikasi mengalami gangguan sementara. Tenang, saldo dan data finansial Anda tetap aman terkunci.
          </Text>

          {/* Box Kode Referensi Correlation ID */}
          <TouchableOpacity
            style={styles.codeBox}
            activeOpacity={0.8}
            onPress={this.handleCopyCorrelationId}
          >
            <View style={styles.codeBoxHeader}>
              <Ionicons name="finger-print-outline" size={18} color={colors.primary} />
              <Text style={styles.codeBoxLabel}>KODE REFERENSI PENGADUAN</Text>
            </View>
            <Text selectable style={styles.codeText}>
              ID Pelacakan: {trackingId}
            </Text>
            <Text style={styles.codeHint}>Ketuk untuk melihat detail pelacakan tiket</Text>
          </TouchableOpacity>

          {/* Tombol Aksi Pemulihan */}
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={this.handleReset}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.surface} style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>Muat Ulang Aplikasi</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FEE2E2', // Soft Red Background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textMain,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 12,
  },
  codeBox: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  codeBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  codeText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: colors.textMain,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  codeHint: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
