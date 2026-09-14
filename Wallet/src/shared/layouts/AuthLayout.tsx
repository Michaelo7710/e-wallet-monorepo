import React from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import bgImage from '@assets/images/Auth-bg.png';
import { NetworkStatusBanner } from '@shared/components';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={bgImage}
      style={styles.background}
    >
      {/* Banner status jaringan offline/online di layer paling atas */}
      <NetworkStatusBanner />

      {/* Indikator baterai/waktu berwarna putih di atas background gelap */}
      <StatusBar style="light" />

      <View
        style={[
          styles.overlay,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          {children}
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 24,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default AuthLayout;