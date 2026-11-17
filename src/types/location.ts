/**
 * FreshG / PresidentKu – Location & Geofencing Types (Week 10: Sprint 08)
 */
import type * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude?: number | null;
  speed?: number | null;
  timestamp?: number | null;
}

export interface GeocodedAddress {
  formattedAddress: string;
  name?: string | null;
  street?: string | null;
  district?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface GeofenceArea {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  description: string;
}

export type GeofenceEvent = 'enter' | 'exit' | null;

export interface BatteryOptimizationConfig {
  accuracy: Location.Accuracy;
  timeInterval: number; // in ms
  distanceInterval: number; // in meters
}

