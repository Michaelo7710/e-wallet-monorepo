import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { UserLayout } from '@shared/layouts';
import { ButtonCustom } from '@shared/components';
import { useAuthStore } from '@core/storage/useAuthStore';
import { BiometricsService } from '@core/security/biometrics.service';
import { colors, typography, spacing } from '@core/theme';
import defaultAvatar from '@assets/images/avatar-default.png';

type MenuType = {
  id: string;
  icon: any;
  title: string;
  subtitle?: string;
  color: string;
};

const PROFILE_MENUS: MenuType[] = [
  {
    id: '1',
    icon: 'shield-checkmark-outline',
    title: 'PIN Transaksi',
    subtitle: 'Ubah atau kelola PIN transaksi',
    color: colors.primary,
  },
  {
    id: '2',
    icon: 'key-outline',
    title: 'Ubah Kata Sandi',
    subtitle: 'Perbarui kata sandi akun',
    color: colors.warning,
  },
  {
    id: '3',
    icon: 'mail-outline',
    title: 'Ubah Alamat Email',
    subtitle: 'Perbarui email akun terdaftar',
    color: colors.info,
  },
  {
    id: '4',
    icon: 'card-outline',
    title: 'Rekening Bank',
    subtitle: 'Atur rekening penarikan',
    color: colors.primaryDark,
  },
  {
    id: '5',
    icon: 'help-buoy-outline',
    title: 'Pusat Bantuan',
    subtitle: 'Hubungi layanan pelanggan',
    color: colors.warning,
  },
  {
    id: '6',
    icon: 'document-text-outline',
    title: 'Syarat & Ketentuan',
    color: colors.textMuted,
  },
];

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logoutSession, isBiometricsEnabled, setBiometricsEnabled } =
    useAuthStore();

  const [isBiometricAvailable, setIsBiometricAvailable] = useState<boolean>(false);

  useEffect(() => {
    const initBiometrics = async () => {
      try {
        const available = await BiometricsService.isAvailable();
        setIsBiometricAvailable(available);
      } catch {
        setIsBiometricAvailable(false);
      }
    };

    initBiometrics();
  }, []);

  const handleToggleBiometrics = async () => {
    const nextValue = !isBiometricsEnabled;
    if (nextValue) {
      const verified = await BiometricsService.authenticate(
        'Konfirmasi biometrik untuk mengaktifkan kunci biometrik'
      );
      if (verified) {
        await setBiometricsEnabled(true);
      } else {
        Alert.alert(
          'Aktivasi Dibatalkan',
          'Gagal memverifikasi biometrik. Pengaturan tidak diubah.'
        );
      }
    } else {
      await setBiometricsEnabled(false);
    }
  };

  const handleMenuPress = (menuId: string) => {
    switch (menuId) {
      case '1':
        navigation.navigate('ChangePin');
        break;
      case '2':
        navigation.navigate('ChangePassword');
        break;
      case '3':
        navigation.navigate('ChangeEmail');
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar dari Akun',
      'Apakah Anda yakin ingin keluar dari dompet digital Anda?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await logoutSession();
          },
        },
      ]
    );
  };

  const renderMenuRow = (menu: MenuType) => (
    <TouchableOpacity
      key={menu.id}
      style={styles.menuRow}
      activeOpacity={0.7}
      onPress={() => handleMenuPress(menu.id)}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.iconBox, { backgroundColor: `${menu.color}15` }]}>
          <Ionicons name={menu.icon} size={22} color={menu.color} />
        </View>
        <View>
          <Text style={styles.menuTitle}>{menu.title}</Text>
          {menu.subtitle && (
            <Text style={styles.menuSubtitle}>{menu.subtitle}</Text>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <UserLayout noPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      >
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <View style={styles.profileCard}>
          <Image
            source={user?.avatar ? { uri: user.avatar } : defaultAvatar}
            style={styles.avatar}
            contentFit="cover"
            transition={300}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.username || 'Pengguna'}</Text>
            <Text style={styles.userEmail}>
              {user?.email || 'email@domain.com'}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{user?.phoneNumber || '-'}</Text>
              </View>
              <View
                style={[
                  styles.kycBadge,
                  user?.isVerified
                    ? styles.kycBadgeVerified
                    : styles.kycBadgeUnverified,
                ]}
              >
                <Ionicons
                  name={
                    user?.isVerified
                      ? 'shield-checkmark'
                      : 'alert-circle-outline'
                  }
                  size={12}
                  color={user?.isVerified ? colors.primaryDark : colors.warning}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.kycBadgeText,
                    {
                      color: user?.isVerified
                        ? colors.primaryDark
                        : colors.warning,
                    },
                  ]}
                >
                  {user?.isVerified
                    ? 'Akun Premium (Limit Rp 50 Jt)'
                    : 'Akun Basic (Limit Rp 5 Jt)'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {!user?.isVerified && (
          <TouchableOpacity
            style={styles.kycBanner}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('KycVerification')}
          >
            <View style={styles.kycBannerLeft}>
              <View style={styles.kycBannerIconBox}>
                <Ionicons name="sparkles" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.kycBannerTitle}>Upgrade ke Premium (KYC)</Text>
                <Text style={styles.kycBannerSubtitle}>
                  Tingkatkan limit saldo transaksi hingga Rp 50.000.000
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.accent} />
          </TouchableOpacity>
        )}

        {/* Pengaturan Akun & Keamanan */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
          <View style={styles.menuBox}>
            {/* Opsi Biometrik (Hanya muncul jika perangkat mendukung & terdaftar di OS) */}
            {isBiometricAvailable && (
              <View style={styles.biometricRow}>
                <View style={styles.menuLeft}>
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: `${colors.primary}15` },
                    ]}
                  >
                    <Ionicons
                      name="finger-print-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Text style={styles.menuTitle}>
                      Kunci Biometrik (Face ID / Sidik Jari)
                    </Text>
                    <Text style={styles.menuSubtitle}>
                      Masuk cepat menggunakan sensor biometrik
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isBiometricsEnabled}
                  onValueChange={handleToggleBiometrics}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={isBiometricsEnabled ? colors.primary : colors.surface}
                />
              </View>
            )}

            {PROFILE_MENUS.map(renderMenuRow)}
          </View>
        </View>

        <View style={styles.logoutContainer}>
          <ButtonCustom
            title="Keluar Akun"
            variant="danger"
            onPress={handleLogout}
          />
          <Text style={styles.versionText}>Aplikasi Wallet v1.0.0</Text>
        </View>
      </ScrollView>
    </UserLayout>
  );
};

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: spacing.radius.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.textMain,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: spacing.radius.full,
    backgroundColor: colors.border,
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  badgeContainer: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.radius.sm,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium as any,
    color: colors.primaryDark,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.radius.sm,
  },
  kycBadgeVerified: {
    backgroundColor: colors.primaryLight,
  },
  kycBadgeUnverified: {
    backgroundColor: `${colors.warning}15`,
  },
  kycBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold as any,
  },
  kycBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  kycBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  kycBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: spacing.radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  kycBannerTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold as any,
    color: colors.textMain,
  },
  kycBannerSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  menuContainer: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMain,
    marginBottom: spacing.md,
  },
  menuBox: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    paddingHorizontal: spacing.md,
  },
  biometricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: spacing.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.medium as any,
    color: colors.textMain,
  },
  menuSubtitle: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  logoutContainer: {
    marginTop: 'auto',
  },
  versionText: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: typography.size.xs,
    marginTop: spacing.md,
  },
});

export default ProfileScreen;