import 'react-native-gesture-handler'; // WAJIB DI BARIS PALING ATAS
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Text, View } from 'react-native';

import AppNavigator from './src/app/navigation/AppNavigator';

// 1. Inisialisasi Mesin Caching API
const queryClient = new QueryClient();

export default function App() {
  return (
    /**
     * LAPIS 1: Responsivitas Gerakan (60 FPS Animation Foundation)
     * Tanpa ini, library animasi dan bottom-sheet akan mati/patah di Android.
     */
    <GestureHandlerRootView style={{ flex: 1 }}>
      
      {/* LAPIS 2: Ekosistem Pengambilan & Cache Data (React Query) */}
      <QueryClientProvider client={queryClient}>
        
        {/* LAPIS 3: Fondasi Area Aman (Notch/Poni HP Handling) */}
        <SafeAreaProvider>
          
          {/* LAPIS 4: Manajer Laci Interaktif (Bottom Sheet Modal) */}
          <BottomSheetModalProvider>
            
            {/* INTI: Otak Navigasi & Logika Auth Guard */}
            <AppNavigator />

            {/* <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text>Isolasi Berhasil! Server Hidup.</Text>
            </View> */}
            
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

// // App.tsx
// import React from 'react';
// import { View, Text } from 'react-native';

// export default function App() {
//   return (
//     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//       <Text>Mesin Inti React Native Hidup!</Text>
//     </View>
//   );
// }