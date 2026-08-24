import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import HomeScreen from '@features/user/screens/HomeScreen';
import HistoryScreen from '@features/user/screens/HistoryScreen';
import ProfileScreen from '@features/user/screens/ProfileScreen';
import { colors, typography } from '@core/theme';

const Tab = createBottomTabNavigator();

const UserTab = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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