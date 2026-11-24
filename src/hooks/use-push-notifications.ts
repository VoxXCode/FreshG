/**
 * Custom Hook untuk Push Notifications (Week 11 Sprint 09)
 * Mengelola lifecycle registrasi token, listener penerimaan notifikasi, dan respon tap.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { notificationService } from '@/data/services/notification-service';
import type {
  NotificationLogItem,
  NotificationPayloadData,
  PushTokenRegistrationResult,
} from '@/types/notification';

export function usePushNotifications() {
  const [tokenResult, setTokenResult] = useState<PushTokenRegistrationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [latestNotification, setLatestNotification] = useState<Notifications.Notification | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const router = useRouter();

  // Helper untuk mencatat log aktivitas notifikasi ke UI
  const addLog = useCallback(
    (
      title: string,
      body: string,
      source: NotificationLogItem['source'],
      data?: NotificationPayloadData
    ) => {
      const newLog: NotificationLogItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString('id-ID'),
        title,
        body,
        source,
        data,
      };
      setLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    },
    []
  );

  // TASK 01: Registrasi Perangkat
  const registerDevice = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.registerForPushNotificationsAsync();
      setTokenResult(res);
      addLog(
        'Registrasi Perangkat',
        res.token ? `Token berhasil didapat: ${res.token.substring(0, 28)}...` : res.message || 'Gagal mendaftar',
        'received_foreground',
        { token: res.token }
      );
      return res;
    } finally {
      setIsLoading(false);
    }
  }, [addLog]);

  // TASK 02: Kirim Notifikasi Contoh (Preset Bahan Kedaluwarsa, Resep, Todo)
  const sendTestNotification = useCallback(
    async (
      preset: 'expiry' | 'recipe' | 'todo' | 'custom',
      customData?: { title: string; body: string; screen: string },
      delaySeconds = 1
    ) => {
      let title = '';
      let body = '';
      let data: NotificationPayloadData = {};

      if (preset === 'expiry') {
        title = 'FreshG: Bahan Hampir Kedaluwarsa!';
        body = 'Susu Segar Anda tersisa 1 hari lagi. Tekan untuk memeriksa stok chiller.';
        data = { screen: '/stok', type: 'expiry_reminder', id: 3 };
      } else if (preset === 'recipe') {
        title = 'FreshG: Rekomendasi Menu Hari Ini!';
        body = 'Ada resep Rendang Daging Sapi & Sayur Segar dari TheMealDB.';
        data = { screen: '/tips', type: 'recipe_recommendation', category: 'Beef' };
      } else if (preset === 'todo') {
        title = 'FreshG: Pengingat Daftar Belanja';
        body = 'Ada 3 bahan belanjaan yang belum Anda beli di pasar.';
        data = { screen: '/todo', type: 'todo_reminder' };
      } else if (customData) {
        title = customData.title;
        body = customData.body;
        data = { screen: customData.screen, type: 'custom' };
      }

      addLog(`Mengirim Notifikasi: ${title}`, body, 'scheduled_local', data);

      // 1. Jadwalkan notifikasi lokal untuk pengujian instan ke sistem device
      await notificationService.scheduleLocalNotification(title, body, data, delaySeconds);

      // 2. Jika token resmi ada, kirim juga melalui Expo Push API (Cloud Delivery)
      if (tokenResult?.token && tokenResult.isDevice) {
        void notificationService.sendPushNotification(tokenResult.token, title, body, data);
      }
    },
    [tokenResult, addLog]
  );

  // TASK 03: Pasang Event Listeners (Slide 14)
  useEffect(() => {
    let isMounted = true;

    // Registrasi asinkron saat pertama kali hook dimuat
    const initRegistration = async () => {
      try {
        const res = await notificationService.registerForPushNotificationsAsync();
        if (isMounted) {
          setTokenResult(res);
          addLog(
            'Registrasi Perangkat',
            res.token ? `Token: ${res.token.substring(0, 28)}...` : res.message || 'Gagal mendaftar',
            'received_foreground',
            { token: res.token }
          );
        }
      } catch (err) {
        console.log('[usePushNotifications] Log init status:', err);
      }
    };

    void initRegistration();

    // Listener 1: Menerima notifikasi saat aplikasi berada di FOREGROUND (Slide 9)
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      if (!isMounted) return;
      setLatestNotification(notification);
      const { title, body, data } = notification.request.content;
      console.log('[NotificationListener] Notifikasi diterima (Foreground):', title);
      addLog(title || 'Notifikasi Masuk', body || '', 'received_foreground', data as NotificationPayloadData);
    });

    // Listener 2: Menerespons saat notifikasi DITEKAN/DIKLIK pengguna (Deep Linking - Slide 10 & 14)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      if (!isMounted) return;
      const { title, body, data } = response.notification.request.content;
      console.log('[NotificationResponse] Pengguna menekan notifikasi:', title, data);
      addLog(`Tap Notifikasi: ${title}`, body || '', 'response_tapped', data as NotificationPayloadData);

      const targetScreen = notificationService.extractNavigationTarget(response);
      console.log('[NotificationResponse] Navigasi Deep Linking ke:', targetScreen);

      // Eksekusi Deep Linking menggunakan Expo Router
      try {
        router.push(targetScreen as any);
      } catch (err) {
        console.log('[NotificationResponse] Navigasi rute dialihkan:', targetScreen, err);
      }
    });

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [addLog, router]);

  return {
    tokenResult,
    expoPushToken: tokenResult?.token ?? null,
    isDevice: tokenResult?.isDevice ?? false,
    permissionStatus: tokenResult?.status ?? 'undetermined',
    isLoading,
    logs,
    latestNotification,
    registerDevice,
    requestPermissions: notificationService.requestDevicePermissions,
    sendTestNotification,
    clearLogs: () => setLogs([]),
  };
}
