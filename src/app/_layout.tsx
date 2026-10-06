import { DarkTheme, DefaultTheme, ThemeProvider, Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import BottomTabBar from '@/components/bottom-tab-bar';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
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
