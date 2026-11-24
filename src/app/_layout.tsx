import { useEffect } from 'react';
import { useColorScheme, LogBox } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, Tabs, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import BottomTabBar from '@/components/bottom-tab-bar';
import { AuthProvider, useAuth } from '@/context/auth-context';

// Nonaktifkan pop-up overlay peringatan/error LogBox agar tidak menutupi layar pengujian HP
LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync();

/**
 * GlobalNotificationHandler – Menangani Deep Linking saat notifikasi ditekan (Week 11 Slide 10 & 14)
 */
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

/**
 * AuthNavigationGuard – Mengatur proteksi rute (Week 5: Sprint 04 - Task 03)
 * Mengalihkan pengguna unauthenticated ke layar login,
 * dan mengalihkan pengguna authenticated ke beranda.
 */
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
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <BottomTabBar {...props} />}
      >
        {/* Visible tabs */}
        <Tabs.Screen name="index"       options={{ title: 'Beranda' }} />
        <Tabs.Screen name="stok"        options={{ title: 'Stok Bahan' }} />
        <Tabs.Screen name="todo"        options={{ title: 'Daftar Todo' }} />
        <Tabs.Screen name="tips"        options={{ title: 'Tips & Resep' }} />
        <Tabs.Screen name="pengaturan"  options={{ title: 'Pengaturan' }} />

        {/* Hidden – not shown in tab bar */}
        <Tabs.Screen name="notifikasi"  options={{ href: null }} />
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
