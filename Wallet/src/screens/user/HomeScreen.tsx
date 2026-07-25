import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image'; // Menggunakan alat gambar performa tinggi
import { Ionicons } from '@expo/vector-icons';

// Mengimpor Infrastruktur Kita
import UserLayout from '@components/layouts/UserLayout';
import WalletCard from '@components/WalletCard';
import { useAuthStore } from '@store/useAuthStore';
import { getGreetingTime } from '@utils/timeGreeting';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';
import { spacing } from '@theme/spacing';

// Mengimpor gambar lokal sebagai fallback jika user belum punya foto profil
import defaultAvatar from '@assets/images/avatar-default.png';

const HomeScreen = () => {
  // Mengambil data KTP Digital dari Brankas Zustand secara instan
  const user = useAuthStore((state) => state.user);
  
  // Asumsi data saldo dari backend. Jika tidak ada, fallback ke 0.
  // Di tahap selanjutnya, ini akan ditarik dari API menggunakan React Query.
  const currentBalance = user?.balance || 2500000; 

  return (
    // noPadding kita set false agar margin kiri-kanan sesuai standar industri
    <UserLayout noPadding={false}>
      
      {/* 1. BAGIAN HEADER: Sapaan & Profil */}
      <View style={styles.headerContainer}>
        <View style={styles.greetingWrapper}>
          {/* Foto Profil dengan sistem Caching super cepat */}
          <Image
            source={user?.avatar ? { uri: user.avatar } : defaultAvatar}
            style={styles.avatar}
            contentFit="cover"
            transition={300} // Animasi fade-in halus saat gambar selesai dimuat
          />
          <View style={styles.greetingTextContainer}>
            <Text style={styles.greetingTime}>{getGreetingTime()},</Text>
            {/* Mengambil nama pengguna secara dinamis */}
            <Text style={styles.userName}>{user?.username || 'Pengguna'}</Text>
          </View>
        </View>

        {/* Ikon Notifikasi */}
        <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color={colors.textMain} />
          {/* Badge titik merah tanda ada notifikasi baru */}
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* 2. BAGIAN KARTU SALDO */}
      <View style={styles.cardContainer}>
        <WalletCard 
          balance={currentBalance} 
          userName={user?.username || 'E-Wallet User'} 
        />
      </View>

      {/* 3. BAGIAN MENU CEPAT (Quick Actions) */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Aksi Cepat</Text>
        <View style={styles.actionGrid}>
          
          <ActionMenu icon="arrow-up" label="Transfer" color={colors.info} />
          <ActionMenu icon="add" label="Top Up" color={colors.success} />
          <ActionMenu icon="card-outline" label="Tarik Tunai" color={colors.warning} />
          <ActionMenu icon="grid-outline" label="Lainnya" color={colors.primary} />

        </View>
      </View>

    </UserLayout>
  );
};

// Komponen Pembantu Khusus Halaman Ini (Local Component)
// Dipisah agar struktur grid lebih DRY (Don't Repeat Yourself)
const ActionMenu = ({ icon, label, color }: { icon: any, label: string, color: string }) => (
  <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
    <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}> 
      {/* Warna background dibuat transparan 15% dari warna aslinya */}
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  greetingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: spacing.radius.full,
    backgroundColor: colors.border, // Warna sementara saat memuat gambar
  },
  greetingTextContainer: {
    marginLeft: spacing.md,
  },
  greetingTime: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  userName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  notificationBtn: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
    borderWidth: 1,
    borderColor: colors.white,
  },
  cardContainer: {
    marginBottom: spacing.xxl,
  },
  quickActionsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMain,
    marginBottom: spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  actionButton: {
    alignItems: 'center',
    width: '22%', // Membagi layar menjadi 4 kolom dengan jarak proporsional
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: spacing.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: typography.weight.medium as any,
  },
});

export default HomeScreen;