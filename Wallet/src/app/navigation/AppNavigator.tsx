// import React, { useEffect } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { View, ActivityIndicator } from 'react-native';
// import { useAuthStore } from '@store/useAuthStore';

// import AuthStack from './AuthStack';
// import UserTab from './UserTab';

// const AppNavigator = () => {
//   const { isAuthenticated, isLoading, hydrate } = useAuthStore();

//   // Saat aplikasi pertama kali dibuka, jalankan fungsi hydrate 
//   // untuk mengecek token di SecureStore
//   useEffect(() => {
//     hydrate();
//   }, [hydrate]);

//   // Tampilkan layar loading sementara saat memeriksa token
//   if (isLoading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color="#0000ff" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       {/* Logika Guard: Jika punya KTP, masuk. Jika tidak, ke pintu depan. */}
//       {isAuthenticated ? <UserTab /> : <AuthStack />}
//     </NavigationContainer>
//   );
// };

// export default AppNavigator;

// import React, { useEffect } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { View, ActivityIndicator } from 'react-native';
// import { useAuthStore } from '@core/storage/useAuthStore';
// import AuthStack from './AuthStack';
// import UserTab from './UserTab';

// const AppNavigator = () => {
//   const { isAuthenticated, isLoading, hydrate } = useAuthStore();

//   useEffect(() => {
//     hydrate();
//   }, [hydrate]);

//   if (isLoading) {
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color="#047857" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       {isAuthenticated ? <UserTab /> : <AuthStack />}
//     </NavigationContainer>
//   );
// };

// export default AppNavigator;

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@core/storage/useAuthStore';
import { colors } from '@core/theme';
import AuthStack from './AuthStack';
import UserStack from './UserStack';

const AppNavigator = () => {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <UserStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;