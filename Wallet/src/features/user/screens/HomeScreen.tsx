// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import { Image } from 'expo-image';
// import { Ionicons } from '@expo/vector-icons';

// import { UserLayout } from '@shared/layouts';
// import { WalletCard } from '@shared/components';
// import { useAuthStore } from '@core/storage/useAuthStore';
// import { getGreetingTime } from '@shared/utils';
// import { colors, typography, spacing } from '@core/theme';
// import defaultAvatar from '@assets/images/avatar-default.png';

// const HomeScreen = () => {
//   const user = useAuthStore((state) => state.user);
//   const currentBalance = user?.balance || 0;

//   return (
//     <UserLayout noPadding={false}>
//       <View style={styles.headerContainer}>
//         <View style={styles.greetingWrapper}>
//           <Image
//             source={user?.avatar ? { uri: user.avatar } : defaultAvatar}
//             style={styles.avatar}
//             contentFit="cover"
//             transition={300}
//           />
//           <View style={styles.greetingTextContainer}>
//             <Text style={styles.greetingTime}>{getGreetingTime()},</Text>
//             <Text style={styles.userName}>{user?.username || 'Pengguna'}</Text>
//           </View>
//         </View>
//         <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
//           <Ionicons name="notifications-outline" size={24} color={colors.textMain} />
//           <View style={styles.notificationBadge} />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.cardContainer}>
//         <WalletCard
//           balance={currentBalance}
//           userName={user?.username || 'E-Wallet User'}
//         />
//       </View>

//       <View style={styles.quickActionsContainer}>
//         <Text style={styles.sectionTitle}>Aksi Cepat</Text>
//         <View style={styles.actionGrid}>
//           <ActionMenu icon="arrow-up" label="Transfer" color={colors.info} />
//           <ActionMenu icon="add" label="Top Up" color={colors.success} />
//           <ActionMenu icon="card-outline" label="Tarik Tunai" color={colors.warning} />
//           <ActionMenu icon="grid-outline" label="Lainnya" color={colors.primary} />
//         </View>
//       </View>
//     </UserLayout>
//   );
// };

// const ActionMenu = ({ icon, label, color }: { icon: any; label: string; color: string }) => (
//   <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
//     <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
//       <Ionicons name={icon} size={28} color={color} />
//     </View>
//     <Text style={styles.actionLabel}>{label}</Text>
//   </TouchableOpacity>
// );

// const styles = StyleSheet.create({
//   headerContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: spacing.sm,
//     marginBottom: spacing.xl,
//   },
//   greetingWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   avatar: {
//     width: 50,
//     height: 50,
//     borderRadius: spacing.radius.full,
//     backgroundColor: colors.border,
//   },
//   greetingTextContainer: {
//     marginLeft: spacing.md,
//   },
//   greetingTime: {
//     fontSize: typography.size.sm,
//     color: colors.textMuted,
//   },
//   userName: {
//     fontSize: typography.size.lg,
//     fontWeight: typography.weight.bold as any,
//     color: colors.textMain,
//   },
//   notificationBtn: {
//     padding: spacing.sm,
//     backgroundColor: colors.surface,
//     borderRadius: spacing.radius.full,
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   notificationBadge: {
//     position: 'absolute',
//     top: 8,
//     right: 10,
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: colors.error,
//     borderWidth: 1,
//     borderColor: colors.white,
//   },
//   cardContainer: {
//     marginBottom: spacing.xxl,
//   },
//   quickActionsContainer: {
//     flex: 1,
//   },
//   sectionTitle: {
//     fontSize: typography.size.lg,
//     fontWeight: typography.weight.semibold as any,
//     color: colors.textMain,
//     marginBottom: spacing.md,
//   },
//   actionGrid: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//   },
//   actionButton: {
//     alignItems: 'center',
//     width: '22%',
//   },
//   iconBox: {
//     width: 56,
//     height: 56,
//     borderRadius: spacing.radius.lg,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: spacing.sm,
//   },
//   actionLabel: {
//     fontSize: typography.size.xs,
//     color: colors.textMuted,
//     textAlign: 'center',
//     fontWeight: typography.weight.medium as any,
//   },
// });

// export default HomeScreen;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { UserLayout } from '@shared/layouts';
import { WalletCard } from '@shared/components';
import { getGreetingTime } from '@shared/utils';
import { colors, typography, spacing } from '@core/theme';
import { useUserProfile } from '../hooks/useUserData';
import defaultAvatar from '@assets/images/avatar-default.png';

const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { data: user, refetch, isRefetching } = useUserProfile();
  const currentBalance = user?.balance ?? 0;

  return (
    <UserLayout noPadding={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.headerContainer}>
          <View style={styles.greetingWrapper}>
            <Image
              source={user?.avatar ? { uri: user.avatar } : defaultAvatar}
              style={styles.avatar}
              contentFit="cover"
              transition={300}
            />
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greetingTime}>{getGreetingTime()},</Text>
              <Text style={styles.userName}>{user?.username || 'Pengguna'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={24} color={colors.textMain} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContainer}>
          <WalletCard
            balance={currentBalance}
            userName={user?.username || 'E-Wallet User'}
          />
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          <View style={styles.actionGrid}>
            <ActionMenu
              icon="arrow-up"
              label="Transfer"
              color={colors.info}
              onPress={() => navigation.navigate('Transfer')}
            />
            <ActionMenu
              icon="add"
              label="Top Up"
              color={colors.success}
              onPress={() => navigation.navigate('TopUp')}
            />
            <ActionMenu
              icon="card-outline"
              label="Tarik Tunai"
              color={colors.warning}
              onPress={() => navigation.navigate('Withdraw')}
            />
            <ActionMenu
              icon="grid-outline"
              label="Lainnya"
              color={colors.primary}
              onPress={() => navigation.navigate('Riwayat')}
            />
          </View>
        </View>
      </ScrollView>
    </UserLayout>
  );
};

const ActionMenu = ({
  icon,
  label,
  color,
  onPress,
}: {
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.actionButton} activeOpacity={0.7} onPress={onPress}>
    <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
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
  greetingWrapper: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: spacing.radius.full,
    backgroundColor: colors.border,
  },
  greetingTextContainer: { marginLeft: spacing.md },
  greetingTime: { fontSize: typography.size.sm, color: colors.textMuted },
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
  cardContainer: { marginBottom: spacing.xxl },
  quickActionsContainer: { flex: 1 },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold as any,
    color: colors.textMain,
    marginBottom: spacing.md,
  },
  actionGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  actionButton: { alignItems: 'center', width: '22%' },
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