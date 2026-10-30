/**
 * Network Status Hook – FreshG (Sprint 05: Offline Handling)
 *
 * Mendeteksi status konektivitas internet perangkat:
 * - Menggunakan `expo-network` pada platform native (iOS & Android)
 * - Fallback `navigator.onLine` pada platform Web
 * - Menyediakan mode simulasi (Testing Mode) untuk kemudahan demo Sprint 05
 */
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Network from 'expo-network';

// State simulasi global untuk pengujian demonstrasi offline (Slide 11 & 12)
let simulatedOffline = false;
const listeners = new Set<(isOffline: boolean) => void>();

export function setSimulatedOffline(value: boolean) {
  simulatedOffline = value;
  listeners.forEach(fn => fn(value));
}

export function getSimulatedOffline() {
  return simulatedOffline;
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(!simulatedOffline);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (simulatedOffline) {
      setIsOnline(false);
      return false;
    }

    setIsChecking(true);
    try {
      if (Platform.OS === 'web') {
        const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
        setIsOnline(online);
        return online;
      }

      const state = await Network.getNetworkStateAsync();
      const connected = Boolean(state.isConnected && (state.isInternetReachable ?? true));
      setIsOnline(connected);
      return connected;
    } catch (e) {
      console.warn('[NetworkStatus] Gagal memeriksa status jaringan:', e);
      setIsOnline(true);
      return true;
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Pemeriksaan koneksi awal secara asynchronous tanpa memicu synchronous setState in effect
    const initialCheck = async () => {
      if (simulatedOffline) {
        if (isMounted) setIsOnline(false);
        return;
      }
      try {
        if (Platform.OS === 'web') {
          const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
          if (isMounted) setIsOnline(online);
          return;
        }

        const state = await Network.getNetworkStateAsync();
        const connected = Boolean(state.isConnected && (state.isInternetReachable ?? true));
        if (isMounted) setIsOnline(connected);
      } catch {
        if (isMounted) setIsOnline(true);
      }
    };

    void initialCheck();

    // Listener simulasi offline
    const simListener = (isOff: boolean) => {
      if (isMounted) setIsOnline(!isOff);
    };
    listeners.add(simListener);

    // Event listener untuk Web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => {
        if (isMounted && !simulatedOffline) setIsOnline(true);
      };
      const handleOffline = () => {
        if (isMounted) setIsOnline(false);
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        isMounted = false;
        listeners.delete(simListener);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    return () => {
      isMounted = false;
      listeners.delete(simListener);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    isChecking,
    checkConnection,
    simulatedOffline,
    setSimulatedOffline,
  };
}
