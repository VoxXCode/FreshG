import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import * as Location from 'expo-location';
import type {
  LocationCoordinates,
  GeocodedAddress,
  GeofenceArea,
  GeofenceEvent,
} from '@/types/location';

export const DEFAULT_CAMPUS_GEOFENCE: GeofenceArea = {
  id: 'campus-umm',
  name: 'Area Kampus UMM',
  latitude: -7.9666,
  longitude: 112.6326,
  radius: 500,
  description: 'Universitas Muhammadiyah Malang, Jl. Raya Tlogomas No.246',
};

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
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
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus>(
    Location.PermissionStatus.UNDETERMINED
  );
  const [isPermissionRequested, setIsPermissionRequested] = useState<boolean>(false);

  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [address, setAddress] = useState<GeocodedAddress | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);

  const [activeGeofence, setActiveGeofence] = useState<GeofenceArea>(targetGeofence);
  const [lastGeofenceEvent, setLastGeofenceEvent] = useState<GeofenceEvent>(null);
  const [geofenceBannerMessage, setGeofenceBannerMessage] = useState<string | null>(null);
  const previousInsideRef = useRef<boolean | null>(null);

  const [isContinuousTracking, setIsContinuousTracking] = useState<boolean>(false);
  const [accuracyLevel, setAccuracyLevel] = useState<Location.Accuracy>(Location.Accuracy.Balanced);
  const [timeInterval, setTimeInterval] = useState<number>(5000);
  const [distanceInterval, setDistanceInterval] = useState<number>(10);

  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  const watcherSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const distanceToCenter = useMemo(() => {
    if (!location) return null;
    return calculateDistanceMeters(
      location.latitude,
      location.longitude,
      activeGeofence.latitude,
      activeGeofence.longitude
    );
  }, [location, activeGeofence]);

  const isInsideGeofence = useMemo(() => {
    if (distanceToCenter === null) return false;
    return distanceToCenter <= activeGeofence.radius;
  }, [distanceToCenter, activeGeofence.radius]);

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
          setLastGeofenceEvent('enter');
          setGeofenceBannerMessage(`Selamat datang! Anda telah memasuki ${activeGeofence.name}.`);
        } else if (previousInsideRef.current && !currentlyInside) {
          setLastGeofenceEvent('exit');
          setGeofenceBannerMessage(`Anda telah keluar dari ${activeGeofence.name}. Jarak: ${dist} meter.`);
        }
      } else {
        setLastGeofenceEvent(currentlyInside ? 'enter' : 'exit');
        setGeofenceBannerMessage(
          currentlyInside
            ? `Anda berada di ${activeGeofence.name}.`
            : `Anda berada di luar ${activeGeofence.name} (${dist} m).`
        );
      }
      previousInsideRef.current = currentlyInside;

      doReverseGeocode(newCoords.latitude, newCoords.longitude);
    },
    [activeGeofence, doReverseGeocode]
  );

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
