import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { UserLayout } from '@shared/layouts';
import { ButtonCustom } from '@shared/components';
import { useAuthStore } from '@core/storage/useAuthStore';
import { colors, typography, spacing } from '@core/theme';
import defaultAvatar from '@assets/images/avatar-default.png';

type MenuType = { id: string; icon: any; title: string; subtitle?: string; color: string };

const PROFILE_MENUS: MenuType[] = [
  { id: '1', icon: 'shield-checkmark-outline', title: 'Keamanan & PIN', subtitle: 'Ubah PIN & Password', color: colors.primary },
  { id: '2', icon: 'card-outline', title: 'Rekening Bank', subtitle: 'Atur rekening penarikan', color: colors.info },
  { id: '3', icon: 'help-buoy-outline', title: 'Pusat Bantuan', subtitle: 'Hubungi layanan pelanggan', color: colors.warning },
  { id: '4', icon: 'document-text-outline', title: 'Syarat & Ketentuan', color: colors.textMuted },
];

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logoutSession } = useAuthStore();

  const handleMenuPress = (menuId: string) => {
    if (menuId === '1') {
      navigation.navigate('ChangePin');
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
          {menu.subtitle && <Text style={styles.menuSubtitle}>{menu.subtitle}</Text>}
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
            <Text style={styles.userEmail}>{user?.email || 'email@domain.com'}</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{user?.phoneNumber || '-'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
          <View style={styles.menuBox}>
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
    marginBottom: spacing.xxl,
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
  badgeContainer: {
    alignSelf: 'flex-start',
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