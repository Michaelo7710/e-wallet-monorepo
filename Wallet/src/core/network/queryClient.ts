import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // Data dianggap segar selama 5 menit
      gcTime: 1000 * 60 * 30,    // Cache disimpan selama 30 menit
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});