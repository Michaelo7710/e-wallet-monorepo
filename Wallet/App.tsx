import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@core/network/queryClient';
import { GlobalErrorBoundary } from '@core/telemetry/GlobalErrorBoundary';
import AppNavigator from './src/app/navigation/AppNavigator';

export default function App() {
  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}