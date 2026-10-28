import { DarkTheme, DefaultTheme, ThemeProvider, Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import BottomTabBar from '@/components/bottom-tab-bar';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { AppThemeProvider, useAppTheme } from '@/context/theme-context';

SplashScreen.preventAutoHideAsync();

function TabLayoutContent() {
  const { isDark } = useAppTheme();

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
      <OfflineBanner />
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <BottomTabBar {...props} />}
      >
        {/* Visible tabs */}
        <Tabs.Screen name="index"       options={{ title: 'Beranda' }} />
        <Tabs.Screen name="stok"        options={{ title: 'Stok Bahan' }} />
        <Tabs.Screen name="tips"        options={{ title: 'Tips & Resep' }} />
        <Tabs.Screen name="pengaturan"  options={{ title: 'Pengaturan' }} />

        {/* Hidden – not shown in tab bar */}
        <Tabs.Screen name="explore"     options={{ href: null }} />
      </Tabs>
    </ThemeProvider>
  );
}

export default function TabLayout() {
  return (
    <AppThemeProvider>
      <TabLayoutContent />
    </AppThemeProvider>
  );
}

