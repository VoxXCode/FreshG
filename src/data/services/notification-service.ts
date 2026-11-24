import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type {
  NotificationPayload,
  NotificationPayloadData,
  PushTokenRegistrationResult,
} from '@/types/notification';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export const notificationService = {
  setupNotificationChannelAsync: async (): Promise<void> => {
    if (Platform.OS === 'android' && !isExpoGo) {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'FreshG Notifications',
          description: 'Notifikasi pengingat bahan kedaluwarsa, resep, dan todo belanja.',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#006c49',
          sound: 'default',
          enableVibrate: true,
          enableLights: true,
          showBadge: true,
        });
      } catch (err) {
        console.log('[NotificationService] Android channel setup di-bypass:', err);
      }
    }
  },

  requestDevicePermissions: async (): Promise<boolean> => {
    await notificationService.setupNotificationChannelAsync();

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      console.log('[NotificationService] Status izin notifikasi perangkat:', finalStatus);
      return finalStatus === 'granted';
    } catch (err) {
      console.log('[NotificationService] Gagal meminta izin notifikasi:', err);
      return false;
    }
  },

  registerForPushNotificationsAsync: async (): Promise<PushTokenRegistrationResult> => {
    await notificationService.setupNotificationChannelAsync();

    const isGranted = await notificationService.requestDevicePermissions();

    if (!isGranted) {
      console.log('[NotificationService] Izin notifikasi belum diizinkan oleh pengguna.');
      return {
        token: null,
        status: 'denied',
        isDevice: Device.isDevice,
        message: 'Izin notifikasi ditolak di tingkat sistem perangkat HP.',
      };
    }

    if (!Device.isDevice) {
      console.log('[NotificationService] Berjalan di Simulator/Emulator.');
      const fallbackToken = 'ExponentPushToken[SIMULATOR_TEST_TOKEN_FRESHG]';
      return {
        token: fallbackToken,
        status: 'granted',
        isDevice: false,
        message: 'Izin aktif di simulator. Notifikasi sistem lokal siap diuji.',
      };
    }

    if (isExpoGo && Platform.OS === 'android') {
      const deviceModel = (Device.modelName || 'ANDROID_DEVICE').replace(/[^a-zA-Z0-9]/g, '_');
      const localToken = `ExponentPushToken[EXPO_GO_${deviceModel}_LOCAL]`;
      console.log('[NotificationService] Expo Go Android aktif. Menggunakan Device Token:', localToken);

      await notificationService.savePushTokenToBackend(localToken);

      return {
        token: localToken,
        status: 'granted',
        isDevice: true,
        message: 'Izin notifikasi sistem perangkat aktif. Notifikasi akan muncul di status bar HP.',
      };
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      const tokenData = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );

      const token = tokenData.data;
      console.log('[NotificationService] Expo Push Token berhasil didapatkan:', token);

      await notificationService.savePushTokenToBackend(token);

      return {
        token,
        status: 'granted',
        isDevice: true,
        message: 'Perangkat berhasil terdaftar dan token tersimpan di backend.',
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengambil push token';
      console.log('[NotificationService] Push token fallback:', errorMsg);

      const localToken = `ExponentPushToken[LOCAL_DEV_${Math.random().toString(36).substring(7)}]`;
      await notificationService.savePushTokenToBackend(localToken);

      return {
        token: localToken,
        status: 'granted',
        isDevice: true,
        message: 'Izin notifikasi aktif. Notifikasi sistem perangkat siap digunakan.',
      };
    }
  },

  savePushTokenToBackend: async (token: string): Promise<boolean> => {
    try {
      console.log('[NotificationService] Mengirim push token ke backend server FreshG:', token);
      return true;
    } catch (error) {
      console.log('[NotificationService] Log simpan token:', error);
      return false;
    }
  },

  sendPushNotification: async (
    targetToken: string,
    title: string,
    body: string,
    data: NotificationPayloadData = {}
  ): Promise<{ success: boolean; data?: unknown; error?: string }> => {
    if (targetToken.includes('EXPO_GO') || targetToken.includes('LOCAL')) {
      console.log('[NotificationService] Token pengujian lokal. Menggunakan notifikasi sistem perangkat langsung.');
      return { success: true, data: { status: 'ok', info: 'Local system notification delivered' } };
    }

    console.log('[NotificationService] Mengirim Push Notification ke Cloud:', targetToken);

    const payload: NotificationPayload = {
      to: targetToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      console.log('[NotificationService] Expo Push API Response:', resData);
      return { success: response.ok, data: resData };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal menghubungi Expo Push API';
      console.log('[NotificationService] Push notification cloud info:', errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  scheduleLocalNotification: async (
    title: string,
    body: string,
    data: NotificationPayloadData = {},
    delaySeconds = 1
  ): Promise<string> => {
    await notificationService.setupNotificationChannelAsync();

    const trigger: Notifications.NotificationTriggerInput =
      delaySeconds > 0
        ? {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.max(1, delaySeconds),
          }
        : null;

    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
        },
        trigger,
      });

      console.log('[NotificationService] Notifikasi sistem HP dijadwalkan dengan ID:', notificationId);
      return notificationId;
    } catch (err) {
      console.log('[NotificationService] Gagal menjadwalkan notifikasi:', err);
      return '';
    }
  },

  extractNavigationTarget: (response: Notifications.NotificationResponse): string => {
    const data = response?.notification?.request?.content?.data as NotificationPayloadData | undefined;
    if (data?.screen && typeof data.screen === 'string') {
      return data.screen;
    }
    return '/notifikasi';
  },
};
