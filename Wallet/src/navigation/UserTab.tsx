import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Mengimpor ketiga pilar kita
import HomeScreen from '@screens/user/HomeScreen';
import HistoryScreen from '@screens/user/HistoryScreen';
import ProfileScreen from '@screens/user/ProfileScreen'; // Tambahan baru

import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

const Tab = createBottomTabNavigator();

const UserTab = () => {
  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false, // Mematikan header bawaan agar UserLayout kita bekerja maksimal
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: {
          fontSize: typography.size.xs,
          fontWeight: '500',
          paddingBottom: Platform.OS === 'ios' ? 0 : 5,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingTop: 5,
        },
        // Konfigurasi Ikon Dinamis
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any = 'home';

          if (route.name === 'Beranda') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Riwayat') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Beranda" component={HomeScreen} />
      <Tab.Screen name="Riwayat" component={HistoryScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default UserTab;