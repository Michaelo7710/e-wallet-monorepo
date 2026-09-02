import { QueryClient, onlineManager } from '@tanstack/react-query';
import { setupNetworkListener } from './networkListener';

// Inisialisasi integrasi NetInfo ke TanStack onlineManager
setupNetworkListener();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      staleTime: 1000 * 60 * 5, // 5 menit
      gcTime: 1000 * 60 * 60 * 24, // 24 jam cache retention
      retry: (failureCount, _error: any) => {
        if (!onlineManager.isOnline()) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 0,
    },
  },
});