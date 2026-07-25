import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';


const App = () => {
  // Fungsi yang dijalankan saat tombol ditekan
  const handlePress = () => {
    Alert.alert('Halo!', 'Kamu baru saja menekan tombol Mulai.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Bagian Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Beranda</Text>
      </View>

      {/* Bagian Konten Utama */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Selamat Datang!</Text>
        <Text style={styles.subtitle}>
          Ini adalah contoh tampilan Home screen sederhana menggunakan React Native.
        </Text>

        {/* Tombol Aksi */}
        <TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Mulai Sekarang</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Kumpulan gaya (styles) untuk komponen di atas
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Warna latar belakang aplikasi
  },
  header: {
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2, // Bayangan untuk Android
    shadowColor: '#000', // Bayangan untuk iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  content: {
    flex: 1,
    justifyContent: 'center', // Mengatur konten ke tengah secara vertikal
    alignItems: 'center',     // Mengatur konten ke tengah secara horizontal
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#0d6efd', // Warna biru khas tombol
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30, // Membuat ujung tombol melengkung
    elevation: 3,
    shadowColor: '#0d6efd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;