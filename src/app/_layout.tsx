import { useEffect } from 'react';
import { useColorScheme, LogBox } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, Tabs, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import BottomTabBar from '@/components/bottom-tab-bar';
import { AuthProvider, useAuth } from '@/context/auth-context';

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

function GlobalNotificationHandler() {
  const router = useRouter();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data as { screen?: string } | undefined;
      if (data?.screen) {
        console.log('[RootLayout] Deep linking via notification tap ke:', data.screen);
        try {
          router.push(data.screen as any);
        } catch (err) {
          console.log('[RootLayout] Gagal navigasi deep link:', err);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null;
}

function AuthNavigationGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inLoginScreen = segments[0] === 'login';

    if (!isAuthenticated && !inLoginScreen) {
      console.log('[AuthGuard] Belum login. Mengarahkan ke /login...');
      router.replace('/login');
    } else if (isAuthenticated && inLoginScreen) {
      console.log('[AuthGuard] Sesi aktif terdeteksi. Mengarahkan ke beranda...');
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return null;
}

function MainNavigation() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AuthNavigationGuard />
      <GlobalNotificationHandler />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
        tabBar={(props) => <BottomTabBar {...props} />}
      >
        <Tabs.Screen name="index"       options={{ title: 'Home' }} />
        <Tabs.Screen name="stok"        options={{ title: 'Stok' }} />
        <Tabs.Screen name="todo"        options={{ title: 'Belanja' }} />
        <Tabs.Screen name="profile"     options={{ title: 'Profile' }} />

        <Tabs.Screen name="notifikasi"          options={{ title: 'Notification', href: null }} />
        <Tabs.Screen name="setting-notifikasi"  options={{ title: 'Notification Settings', href: null }} />
        <Tabs.Screen name="tips"                options={{ title: 'Tips & Resep', href: null }} />
        <Tabs.Screen name="lokasi"      options={{ href: null }} />
        <Tabs.Screen name="sensor"      options={{ href: null }} />
        <Tabs.Screen name="scan"        options={{ href: null }} />
        <Tabs.Screen name="login"       options={{ href: null }} />
        <Tabs.Screen name="explore"     options={{ href: null }} />
      </Tabs>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <MainNavigation />
    </AuthProvider>
  );
}
