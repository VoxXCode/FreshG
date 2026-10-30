/**
 * Motion Sensor Hook – FreshG (Week 7: Sprint 06 - Device Sensor)
 *
 * Mengimplementasikan:
 * 1. Koneksi ke Sensor Accelerometer menggunakan `expo-sensors` (Task 01)
 * 2. Pembacaan data X, Y, Z secara real-time dengan update interval 100ms (Task 02)
 * 3. Log data ke console (Slide 9 & 10)
 * 4. Deteksi pergerakan & goyangan (Shake Detection Threshold) dengan feedback getaran (Task 03)
 * 5. Fallback & simulasi untuk platform Web dan Emulator
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Vibration, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';

export interface AccelerometerPoint {
  x: number;
  y: number;
  z: number;
  magnitude: number;
  timestamp: number;
}

export interface UseMotionSensorOptions {
  updateInterval?: number; // ms, default 100ms
  shakeThreshold?: number; // threshold magnitudo, default 1.45G
  onShake?: () => void;
}

export function useMotionSensor({
  updateInterval = 100,
  shakeThreshold = 1.45,
  onShake,
}: UseMotionSensorOptions = {}) {
  const [data, setData] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [history, setHistory] = useState<AccelerometerPoint[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [shakeCount, setShakeCount] = useState<number>(0);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);

  const lastShakeTimeRef = useRef<number>(0);
  const onShakeRef = useRef(onShake);

  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  // Fungsi pemicu goyang (dipanggil saat sensor melebihi threshold atau via simulasi)
  const triggerShake = useCallback(() => {
    const now = Date.now();
    // Debounce agar tidak terpanggil berulang-ulang dalam 800ms
    if (now - lastShakeTimeRef.current < 800) return;
    lastShakeTimeRef.current = now;

    console.log('[Sensor] Goyang Terdeteksi! Memicu getaran (Vibration.vibrate)...');
    try {
      if (Platform.OS !== 'web') {
        Vibration.vibrate(300);
      }
    } catch {}

    setIsShaking(true);
    setShakeCount(c => c + 1);

    if (onShakeRef.current) {
      onShakeRef.current();
    }

    setTimeout(() => {
      setIsShaking(false);
    }, 600);
  }, []);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let isMounted = true;

    const startSensor = async () => {
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (!isMounted) return;
        setIsAvailable(available);

        if (!available) {
          console.log('[Sensor] Accelerometer fisik tidak tersedia (lingkungan Web/Simulator).');
          return;
        }

        // Setup interval 100ms (Slide 9 & 10)
        Accelerometer.setUpdateInterval(updateInterval);

        subscription = Accelerometer.addListener(accelerometerData => {
          if (!isMounted || !isActive) return;

          const { x, y, z } = accelerometerData;
          const magnitude = Math.sqrt(x * x + y * y + z * z);

          // Log format sesuai output console Slide 9 & 10
          // console.log(`Accelerometer: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`);

          setData({ x, y, z });

          // Simpan riwayat 12 titik terakhir untuk visualisasi grafik perubahan nilai
          setHistory(prev => {
            const nextPoint: AccelerometerPoint = {
              x,
              y,
              z,
              magnitude,
              timestamp: Date.now(),
            };
            const updated = [...prev, nextPoint];
            return updated.length > 12 ? updated.slice(updated.length - 12) : updated;
          });

          // Task 03: Deteksi Threshold Gerakan
          if (magnitude > shakeThreshold) {
            triggerShake();
          }
        });
      } catch (err) {
        console.warn('[Sensor] Error menginisialisasi accelerometer:', err);
      }
    };

    if (isActive) {
      void startSensor();
    }

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.remove();
      }
    };
  }, [isActive, updateInterval, shakeThreshold, triggerShake]);

  // Simulasi goyang untuk pengujian di Web & Emulator
  const simulateShake = useCallback(() => {
    // Buat lonjakan nilai sesaat
    setData({ x: 1.2, y: 1.6, z: 0.9 });
    triggerShake();
    setTimeout(() => {
      setData({ x: 0.05, y: 0.98, z: 0.12 });
    }, 400);
  }, [triggerShake]);

  return {
    data,
    history,
    isActive,
    isShaking,
    shakeCount,
    isAvailable,
    setIsActive,
    simulateShake,
    magnitude: Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z),
  };
}
