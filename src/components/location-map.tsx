/**
 * FreshG / PresidentKu – Location Map Component (Native - Android & iOS)
 * Menggunakan WebView + Leaflet OpenStreetMap (Bebas Biaya & Tanpa Kebutuhan API Key Berbayar).
 * Memenuhi Task 02 (Slide 8 & 13) dan Visual Geofencing (Slide 10 & 14).
 */
import { useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { generateMapHtml } from '@/utils/map-html';
import type { LocationCoordinates, GeofenceArea } from '@/types/location';

interface LocationMapProps {
  userLocation: LocationCoordinates | null;
  geofence: GeofenceArea;
  isInsideGeofence: boolean;
  onCenterUser?: () => void;
  height?: number;
}

export default function LocationMap({
  userLocation,
  geofence,
  isInsideGeofence,
  height = 280,
}: LocationMapProps) {
  const webViewRef = useRef<WebView>(null);

  const htmlContent = useMemo(() => {
    return generateMapHtml({
      userLocation,
      geofence,
      zoom: 15,
      isInsideGeofence,
    });
  }, [userLocation, geofence, isInsideGeofence]);

  const sendMapCommand = (action: string, extra: Record<string, any> = {}) => {
    if (!webViewRef.current) return;
    const msg = JSON.stringify({ action, ...extra });
    webViewRef.current.postMessage(msg);
  };

  const handleCenterUser = () => {
    if (userLocation) {
      sendMapCommand('centerUser', { lat: userLocation.latitude, lng: userLocation.longitude });
    }
  };

  const handleCenterCampus = () => {
    sendMapCommand('centerCampus');
  };

  const handleZoomIn = () => sendMapCommand('zoomIn');
  const handleZoomOut = () => sendMapCommand('zoomOut');

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        renderLoading={() => (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#006c49" />
          </View>
        )}
      />

      {/* ── Overlay Badge Lokasi (Slide 8 & 13) ── */}
      <View style={styles.overlayBadge}>
        <View style={styles.badgeDot} />
        <View>
          <Text style={styles.badgeTitle}>Lokasi Saya</Text>
          <Text style={styles.badgeCoords}>
            {userLocation
              ? `Lat: ${userLocation.latitude.toFixed(4)}, Lng: ${userLocation.longitude.toFixed(4)}`
              : 'Menunggu GPS...'}
          </Text>
        </View>
      </View>

      {/* ── Floating Map Controls (+, -, re-center) ── */}
      <View style={styles.controlsCol}>
        <TouchableOpacity style={styles.ctrlBtn} onPress={handleCenterUser} activeOpacity={0.8}>
          <MaterialIcons name="my-location" size={20} color="#006c49" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctrlBtn} onPress={handleCenterCampus} activeOpacity={0.8}>
          <MaterialIcons name="school" size={20} color="#4f46e5" />
        </TouchableOpacity>

        <View style={styles.zoomGroup}>
          <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn} activeOpacity={0.8}>
            <Feather name="plus" size={18} color="#0b1c30" />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut} activeOpacity={0.8}>
            <Feather name="minus" size={18} color="#0b1c30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#bbcabf',
    position: 'relative',
    backgroundColor: '#eff4ff',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingWrap: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eff4ff',
  },
  overlayBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284c7',
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0b1c30',
  },
  badgeCoords: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  controlsCol: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    gap: 8,
  },
  ctrlBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  zoomGroup: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  zoomBtn: {
    width: 38,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
});

