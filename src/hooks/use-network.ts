import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Network from 'expo-network';
import { networkSimulator } from '@/data/services/network-simulator';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  isOffline: boolean;
  isSimulatedOffline: boolean;
  isSimulatedServerError: boolean;
  toggleSimulatedOffline: () => void;
  toggleSimulatedServerError: () => void;
  checkConnection: () => Promise<boolean>;
}

export function useNetworkStatus(): NetworkStatus {
  const [deviceConnected, setDeviceConnected] = useState<boolean>(true);
  const [internetReachable, setInternetReachable] = useState<boolean>(true);
  const [simulatedOffline, setSimulatedOffline] = useState<boolean>(
    networkSimulator.isSimulatedOffline,
  );
  const [simulatedServerError, setSimulatedServerError] = useState<boolean>(
    networkSimulator.isSimulatedServerError,
  );

  // Periksa koneksi aktual
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
        const online = navigator.onLine;
        setDeviceConnected(online);
        setInternetReachable(online);
        return online && !networkSimulator.isSimulatedOffline;
      }
      const state = await Network.getNetworkStateAsync();
      const connected = Boolean(state.isConnected);
      const reachable = state.isInternetReachable !== false;
      setDeviceConnected(connected);
      setInternetReachable(reachable);
      return connected && reachable && !networkSimulator.isSimulatedOffline;
    } catch {
      // Jika terjadi kegagalan pengecekan, pertahankan state saat ini
      return !networkSimulator.isSimulatedOffline;
    }
  }, []);

  // Listener perubahan simulasi pengembang
  useEffect(() => {
    const unsubscribe = networkSimulator.subscribe(() => {
      setSimulatedOffline(networkSimulator.isSimulatedOffline);
      setSimulatedServerError(networkSimulator.isSimulatedServerError);
    });
    return unsubscribe;
  }, []);

  // Listener event jaringan aktual
  useEffect(() => {
    const timer = setTimeout(() => {
      void checkConnection();
    }, 0);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        setDeviceConnected(true);
        setInternetReachable(true);
      };
      const handleOffline = () => {
        setDeviceConnected(false);
        setInternetReachable(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      // Mobile native listener
      let sub: { remove: () => void } | null = null;
      try {
        sub = Network.addNetworkStateListener(state => {
          setDeviceConnected(Boolean(state.isConnected));
          setInternetReachable(state.isInternetReachable !== false);
        });
      } catch {
        // Fallback polling jika listener tidak didukung
        const interval = setInterval(checkConnection, 5000);
        return () => {
          clearTimeout(timer);
          clearInterval(interval);
        };
      }
      return () => {
        clearTimeout(timer);
        sub?.remove();
      };
    }
  }, [checkConnection]);

  const isActuallyOnline = deviceConnected && internetReachable;
  const isOffline = !isActuallyOnline || simulatedOffline;
  const isConnected = !isOffline;

  return {
    isConnected,
    isInternetReachable: isConnected,
    isOffline,
    isSimulatedOffline: simulatedOffline,
    isSimulatedServerError: simulatedServerError,
    toggleSimulatedOffline: () => networkSimulator.toggleSimulatedOffline(),
    toggleSimulatedServerError: () => networkSimulator.toggleSimulatedServerError(),
    checkConnection,
  };
}
