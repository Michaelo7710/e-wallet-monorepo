import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

/**
 * Mengintegrasikan NetInfo dengan TanStack Query onlineManager
 * agar query runner mengetahui status online/offline secara reaktif.
 */
export const setupNetworkListener = () => {
  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state: NetInfoState) => {
      setOnline(!!state.isConnected && state.isInternetReachable !== false);
    });
  });
};

export interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

/**
 * Custom hook untuk mendeteksi status konektivitas jaringan secara real-time
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    NetInfo.fetch().then((state) => {
      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });
    });

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return status;
};
