/**
 * FreshG / PresidentKu – Hook Pelayanan Berbasis Lokasi (Week 10: Sprint 08 - LBS)
 * Mengimplementasikan:
 * - Task 01: GPS Location & Permission Handling (expo-location)
 * - Task 02: Real-time Coordinates & Map Focus
 * - Task 03: Reverse Geocoding & Geofencing (Deteksi Masuk/Keluar Radius Kampus UMM)
 * - Battery Optimization: Interval & Distance Filtering, Subscription Cleanup
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as Location from 'expo-location';
import type {
  LocationCoordinates,
  GeocodedAddress,
  GeofenceArea,
  GeofenceEvent,
} from '@/types/location';

// ─── Default Reference Area (Kampus UMM - Sesuai Slide 9, 10, 14) ─────────────
export const DEFAULT_CAMPUS_GEOFENCE: GeofenceArea = {
  id: 'campus-umm',
  name: 'Area Kampus UMM',
  latitude: -7.9666,
  longitude: 112.6326,
  radius: 500, // 500 meter (sesuai slide 10)
  description: 'Universitas Muhammadiyah Malang, Jl. Raya Tlogomas No.246',
};

// ─── Haversine Formula untuk Menghitung Jarak Antara 2 Titik Koordinat (Meter) ──
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function useLocationService(targetGeofence: GeofenceArea = DEFAULT_CAMPUS_GEOFENCE) {
  // State Perizinan (Task 01)
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus>(
    Location.PermissionStatus.UNDETERMINED
  );
  const [isPermissionRequested, setIsPermissionRequested] = useState<boolean>(false);

  // State Koordinat Lokasi (Task 01)
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State Reverse Geocoding (Task 03 - Bagian A)
  const [address, setAddress] = useState<GeocodedAddress | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);

  // State Geofencing (Task 03 - Bagian B)
  const [activeGeofence, setActiveGeofence] = useState<GeofenceArea>(targetGeofence);
  const [lastGeofenceEvent, setLastGeofenceEvent] = useState<GeofenceEvent>(null);
  const [geofenceBannerMessage, setGeofenceBannerMessage] = useState<string | null>(null);
  const previousInsideRef = useRef<boolean | null>(null);

  // State Optimasi Baterai (Slide 15)
  const [isContinuousTracking, setIsContinuousTracking] = useState<boolean>(false);
  const [accuracyLevel, setAccuracyLevel] = useState<Location.Accuracy>(Location.Accuracy.Balanced);
  const [timeInterval, setTimeInterval] = useState<number>(5000); // 5 detik
  const [distanceInterval, setDistanceInterval] = useState<number>(10); // 10 meter

  // State Simulasi (untuk mempermudah demonstrasi saat presentasi/evaluasi)
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  // Subscription ref untuk pembersihan memori dan pencegahan battery drain
  const watcherSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Hitung jarak ke pusat geofence
  const distanceToCenter = useMemo(() => {
    if (!location) return null;
    return calculateDistanceMeters(
      location.latitude,
      location.longitude,
      activeGeofence.latitude,
      activeGeofence.longitude
    );
  }, [location, activeGeofence]);

  // Status apakah berada di dalam geofence
  const isInsideGeofence = useMemo(() => {
    if (distanceToCenter === null) return false;
    return distanceToCenter <= activeGeofence.radius;
  }, [distanceToCenter, activeGeofence.radius]);

  // 1. Reverse Geocoding (Task 03 - Bagian A: Slide 9 & 14)
  const doReverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    setIsLoadingAddress(true);
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (results && results.length > 0) {
        const item = results[0];
        const parts: string[] = [];

        if (item.street) parts.push(item.street);
        if (item.district) parts.push(item.district);
        if (item.city) parts.push(item.city);
        if (item.region) parts.push(item.region);
        if (item.postalCode) parts.push(item.postalCode);

        const formatted = parts.length > 0
          ? parts.join(', ')
          : (item.formattedAddress || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

        setAddress({
          formattedAddress: formatted,
          name: item.name,
          street: item.street,
          district: item.district,
          city: item.city,
          region: item.region,
          postalCode: item.postalCode,
          country: item.country,
        });
      } else {
        setAddress({
          formattedAddress: `Koordinat: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        });
      }
    } catch {
      // Fallback contoh alamat edukatif jika koneksi reverse geocode terbatas
      if (Math.abs(latitude - (-7.9666)) < 0.02) {
        setAddress({
          formattedAddress: 'Jl. Raya Tlogomas No.246, Lowokwaru, Kota Malang, Jawa Timur 65144',
          street: 'Jl. Raya Tlogomas No.246',
          district: 'Lowokwaru',
          city: 'Kota Malang',
          region: 'Jawa Timur',
          postalCode: '65144',
        });
      } else {
        setAddress({
          formattedAddress: `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`,
        });
      }
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  // Helper pemrosesan lokasi dan evaluasi geofence transition
  const handleLocationUpdate = useCallback(
    (newCoords: LocationCoordinates) => {
      setLocation(newCoords);

      const dist = calculateDistanceMeters(
        newCoords.latitude,
        newCoords.longitude,
        activeGeofence.latitude,
        activeGeofence.longitude
      );
      const currentlyInside = dist <= activeGeofence.radius;

      if (previousInsideRef.current !== null) {
        if (!previousInsideRef.current && currentlyInside) {
          // Enter Event
          setLastGeofenceEvent('enter');
          setGeofenceBannerMessage(`Selamat datang! Anda telah memasuki ${activeGeofence.name}.`);
        } else if (previousInsideRef.current && !currentlyInside) {
          // Exit Event
          setLastGeofenceEvent('exit');
          setGeofenceBannerMessage(`Anda telah keluar dari ${activeGeofence.name}. Jarak: ${dist} meter.`);
        }
      } else {
        // Status awal
        setLastGeofenceEvent(currentlyInside ? 'enter' : 'exit');
        setGeofenceBannerMessage(
          currentlyInside
            ? `Anda berada di ${activeGeofence.name}.`
            : `Anda berada di luar ${activeGeofence.name} (${dist} m).`
        );
      }
      previousInsideRef.current = currentlyInside;

      // Jalankan reverse geocoding
      doReverseGeocode(newCoords.latitude, newCoords.longitude);
    },
    [activeGeofence, doReverseGeocode]
  );

  // 2. Meminta Izin Lokasi (Slide 11: Location.requestForegroundPermissionsAsync)
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsPermissionRequested(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== Location.PermissionStatus.GRANTED) {
        setErrorMsg('Izin akses lokasi ditolak oleh pengguna.');
        return false;
      }

      setErrorMsg(null);
      return true;
    } catch (err: any) {
      console.warn('[useLocationService] Error requesting permission:', err);
      setErrorMsg(err.message || 'Gagal meminta izin lokasi.');
      return false;
    }
  }, []);

  // 3. Mengambil Lokasi Terkini Sekali (Task 01: Slide 11 & 12)
  const fetchCurrentLocation = useCallback(async (): Promise<LocationCoordinates | null> => {
    setIsLoadingLocation(true);
    setErrorMsg(null);
    setIsSimulated(false);

    try {
      let status = permissionStatus;
      if (status !== Location.PermissionStatus.GRANTED) {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        status = newStatus;
        setPermissionStatus(newStatus);
        if (newStatus !== Location.PermissionStatus.GRANTED) {
          setErrorMsg('Izin lokasi diperlukan untuk mengambil posisi GPS.');
          setIsLoadingLocation(false);
          return null;
        }
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: accuracyLevel,
      });

      const newCoords: LocationCoordinates = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ? Math.round(loc.coords.accuracy * 10) / 10 : null,
        altitude: loc.coords.altitude ? Math.round(loc.coords.altitude * 10) / 10 : null,
        speed: loc.coords.speed ? Math.round(loc.coords.speed * 10) / 10 : null,
        timestamp: loc.timestamp,
      };

      handleLocationUpdate(newCoords);
      setIsLoadingLocation(false);
      return newCoords;
    } catch (err: any) {
      console.warn('[useLocationService] getCurrentPositionAsync error:', err);
      setErrorMsg('Gagal mengambil posisi GPS: ' + err.message);
      setIsLoadingLocation(false);
      return null;
    }
  }, [permissionStatus, accuracyLevel, handleLocationUpdate]);

  // 4. Optimasi Baterai & Continuous Watch Tracking (Slide 15)
  const stopContinuousTracking = useCallback(() => {
    if (watcherSubscriptionRef.current) {
      watcherSubscriptionRef.current.remove();
      watcherSubscriptionRef.current = null;
    }
    setIsContinuousTracking(false);
  }, []);

  const startContinuousTracking = useCallback(async () => {
    stopContinuousTracking();

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status !== Location.PermissionStatus.GRANTED) {
        setErrorMsg('Izin lokasi diperlukan untuk pelacakan berkelanjutan.');
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: accuracyLevel,
          timeInterval: timeInterval,
          distanceInterval: distanceInterval,
        },
        (loc) => {
          const newCoords: LocationCoordinates = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy ? Math.round(loc.coords.accuracy * 10) / 10 : null,
            altitude: loc.coords.altitude ? Math.round(loc.coords.altitude * 10) / 10 : null,
            speed: loc.coords.speed ? Math.round(loc.coords.speed * 10) / 10 : null,
            timestamp: loc.timestamp,
          };
          handleLocationUpdate(newCoords);
        }
      );

      watcherSubscriptionRef.current = subscription;
      setIsContinuousTracking(true);
    } catch (err: any) {
      console.warn('[useLocationService] watchPositionAsync error:', err);
      setErrorMsg('Gagal memulai pelacakan berkelanjutan: ' + err.message);
    }
  }, [
    accuracyLevel,
    timeInterval,
    distanceInterval,
    stopContinuousTracking,
    handleLocationUpdate,
  ]);

  // 5. Fitur Simulasi untuk Pengujian Praktikum & Demo (Slide 16)
  const simulateLocationMove = useCallback(
    (type: 'inside' | 'outside' | 'center') => {
      stopContinuousTracking();
      setIsSimulated(true);

      let simCoords: LocationCoordinates;
      if (type === 'inside') {
        simCoords = {
          latitude: -7.9658,
          longitude: 112.6322,
          accuracy: 6.5,
          altitude: 495,
          speed: 1.2,
          timestamp: Date.now(),
        };
        setAddress({
          formattedAddress: 'Jl. Raya Tlogomas No.246, Lowokwaru, Kota Malang, Jawa Timur 65144',
          name: 'Gedung Kuliah Bersama UMM',
          street: 'Jl. Raya Tlogomas No.246',
          district: 'Lowokwaru',
          city: 'Kota Malang',
          region: 'Jawa Timur',
          postalCode: '65144',
        });
      } else if (type === 'center') {
        simCoords = {
          latitude: -7.9666,
          longitude: 112.6326,
          accuracy: 5.0,
          altitude: 490,
          speed: 0.0,
          timestamp: Date.now(),
        };
        setAddress({
          formattedAddress: 'Universitas Muhammadiyah Malang, Lowokwaru, Kota Malang',
          name: 'Kampus III UMM',
          street: 'Jl. Raya Tlogomas No.246',
          district: 'Lowokwaru',
          city: 'Kota Malang',
          region: 'Jawa Timur',
          postalCode: '65144',
        });
      } else {
        simCoords = {
          latitude: -7.9550,
          longitude: 112.6200,
          accuracy: 12.0,
          altitude: 480,
          speed: 8.5,
          timestamp: Date.now(),
        };
        setAddress({
          formattedAddress: 'Jl. M.T. Haryono, Dinoyo, Kec. Lowokwaru, Kota Malang, Jawa Timur 65145',
          street: 'Jl. M.T. Haryono',
          district: 'Lowokwaru',
          city: 'Kota Malang',
          region: 'Jawa Timur',
          postalCode: '65145',
        });
      }

      // Update location and evaluate geofence transitions
      setLocation(simCoords);
      const dist = calculateDistanceMeters(
        simCoords.latitude,
        simCoords.longitude,
        activeGeofence.latitude,
        activeGeofence.longitude
      );
      const currentlyInside = dist <= activeGeofence.radius;
      setLastGeofenceEvent(currentlyInside ? 'enter' : 'exit');
      setGeofenceBannerMessage(
        currentlyInside
          ? `Selamat datang di area kampus UMM!`
          : `Anda telah keluar dari area kampus UMM (${dist} m).`
      );
      previousInsideRef.current = currentlyInside;
    },
    [stopContinuousTracking, activeGeofence]
  );

  // Clean-up subscription ketika komponen unmount (Aturan Slide 15)
  useEffect(() => {
    return () => {
      if (watcherSubscriptionRef.current) {
        watcherSubscriptionRef.current.remove();
        watcherSubscriptionRef.current = null;
      }
    };
  }, []);

  return {
    permissionStatus,
    isPermissionRequested,
    location,
    isLoadingLocation,
    errorMsg,
    address,
    isLoadingAddress,
    activeGeofence,
    distanceToCenter,
    isInsideGeofence,
    lastGeofenceEvent,
    geofenceBannerMessage,
    isContinuousTracking,
    accuracyLevel,
    timeInterval,
    distanceInterval,
    isSimulated,

    requestLocationPermission,
    fetchCurrentLocation,
    doReverseGeocode,
    startContinuousTracking,
    stopContinuousTracking,
    simulateLocationMove,
    setActiveGeofence,
    setAccuracyLevel,
    setTimeInterval,
    setDistanceInterval,
    dismissBanner: () => setGeofenceBannerMessage(null),
  };
}
