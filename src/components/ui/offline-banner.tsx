/**
 * Offline Banner – FreshG (Sprint 05: Offline Handling)
 *
 * Menampilkan bar peringatan warna ungu hanya saat koneksi terputus (Slide 11 & 12).
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNetworkStatus } from '@/hooks/use-network-status';

export function OfflineBanner({ onRetryAll }: { onRetryAll?: () => void }) {
  const { isOffline, setSimulatedOffline, simulatedOffline, checkConnection } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <View style={s.offlineBar}>
      <View style={s.offlineLeft}>
        <MaterialIcons name="wifi-off" size={18} color="#ffffff" />
        <Text style={s.offlineTxt}>Mode Offline • Tidak ada koneksi internet</Text>
      </View>
      <TouchableOpacity
        style={s.reconnectBtn}
        onPress={async () => {
          if (simulatedOffline) setSimulatedOffline(false);
          await checkConnection();
          if (onRetryAll) onRetryAll();
        }}
        activeOpacity={0.8}
      >
        <MaterialIcons name="refresh" size={14} color="#7c3aed" />
        <Text style={s.reconnectBtnTxt}>Coba Lagi</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  offlineBar: {
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: '100%',
    zIndex: 99,
  },
  offlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  offlineTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  reconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  reconnectBtnTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7c3aed',
  },
});
