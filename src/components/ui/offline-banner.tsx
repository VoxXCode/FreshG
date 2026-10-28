import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetworkStatus } from '@/hooks/use-network';
import { useAppTheme } from '@/context/theme-context';

interface OfflineBannerProps {
  onReconnect?: () => void;
}

export function OfflineBanner({ onReconnect }: OfflineBannerProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { isOffline, isSimulatedOffline, toggleSimulatedOffline, checkConnection } =
    useNetworkStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [checking, setChecking] = useState(false);
  const prevOfflineRef = useRef(isOffline);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    if (prevOfflineRef.current && !isOffline) {
      setTimeout(() => {
        setShowRestored(true);
      }, 0);
      hideTimer = setTimeout(() => {
        setShowRestored(false);
      }, 3000);
    }
    prevOfflineRef.current = isOffline;
    return () => {
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [isOffline]);

  const handleCheckConnection = async () => {
    setChecking(true);
    const online = await checkConnection();
    setChecking(false);
    if (online && onReconnect) {
      onReconnect();
    }
  };

  if (!isOffline && !showRestored) {
    return null;
  }

  if (showRestored) {
    return (
      <View
        style={[
          styles.container,
          styles.onlineContainer,
          isDark && { backgroundColor: '#064e3b', borderBottomColor: '#065f46' },
          { paddingTop: Math.max(insets.top, 10) },
        ]}
      >
        <MaterialCommunityIcons name="check-circle-outline" size={18} color={isDark ? '#34d399' : '#065f46'} />
        <Text style={[styles.text, styles.onlineText, isDark && { color: '#a7f3d0' }]}>Koneksi internet kembali pulih</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        styles.offlineContainer,
        isDark && { backgroundColor: '#451a03', borderBottomColor: '#78350f' },
        { paddingTop: Math.max(insets.top, 10) },
      ]}
    >
      <View style={styles.leftContent}>
        <MaterialCommunityIcons name="wifi-off" size={18} color={isDark ? '#fbbf24' : '#92400e'} />
        <View style={styles.textContent}>
          <Text style={[styles.title, isDark && { color: '#fde68a' }]}>
            Mode Offline {isSimulatedOffline ? '(Simulasi Aktif)' : ''}
          </Text>
          <Text style={[styles.subtitle, isDark && { color: '#fcd34d' }]}>
            Menggunakan data lokal tersimpan. Fitur sinkronisasi ditunda.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {isSimulatedOffline && (
          <Pressable
            style={({ pressed }) => [
              styles.outlineBtn,
              isDark && { backgroundColor: '#291b0f', borderColor: '#f59e0b' },
              pressed && styles.pressed,
            ]}
            onPress={toggleSimulatedOffline}
          >
            <Text style={[styles.outlineBtnText, isDark && { color: '#fde68a' }]}>Matikan</Text>
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
          onPress={handleCheckConnection}
          disabled={checking}
        >
          <MaterialCommunityIcons
            name={checking ? 'loading' : 'refresh'}
            size={14}
            color="#ffffff"
          />
          <Text style={styles.actionBtnText}>{checking ? 'Cek...' : 'Muat Ulang'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    zIndex: 999,
  },
  offlineContainer: {
    backgroundColor: '#fffbeb',
    borderBottomColor: '#fde68a',
  },
  onlineContainer: {
    backgroundColor: '#ecfdf5',
    borderBottomColor: '#a7f3d0',
    justifyContent: 'center',
    gap: 8,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  subtitle: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 1,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  text: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#b45309',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  outlineBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d97706',
    backgroundColor: '#ffffff',
  },
  outlineBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
  },
  pressed: {
    opacity: 0.75,
  },
});
