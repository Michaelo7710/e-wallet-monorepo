import React from 'react';
import { 
  View, 
  StyleSheet, 
  ImageBackground, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

// Mengimpor gambar secara lokal dan elegan. 
// Pastikan nama file sesuai dengan gambar yang Anda masukkan.
import bgImage from '@assets/images/Auth-bg.png'; 

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground 
      source={bgImage} // Menggunakan gambar lokal yang tidak akan pernah lag/gagal muat
      style={styles.background}
    >
      {/* Memaksa indikator baterai/waktu berwarna putih (light) di atas background gelap */}
      <StatusBar style="light" />
      
      <View style={[
        styles.overlay, 
        // Mengamankan konten dari poni kamera
        { paddingTop: insets.top, paddingBottom: insets.bottom } 
      ]}>
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
    backgroundColor: '#000', // Warna fallback jika gambar rusak
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)', // Gelap sedikit dinaikkan agar kontras form lebih baik
    paddingHorizontal: 24,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
  }
});

export default AuthLayout;