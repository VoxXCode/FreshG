import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { darkColors, lightColors, type FreshGColors } from '@/constants/theme-colors';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: FreshGColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'light',
  isDark: false,
  colors: lightColors,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

// Listener singleton untuk sinkronisasi di luar React tree jika dibutuhkan
type ThemeListener = (mode: ThemeMode) => void;
const listeners = new Set<ThemeListener>();
let currentGlobalMode: ThemeMode = 'light';

export const themeManager = {
  getMode: () => currentGlobalMode,
  setMode: (mode: ThemeMode) => {
    currentGlobalMode = mode;
    for (const l of listeners) l(mode);
  },
  subscribe: (l: ThemeListener) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useRNColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(themeManager.getMode());

  useEffect(() => {
    const unsub = themeManager.subscribe(mode => {
      setThemeModeState(mode);
    });
    return unsub;
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    themeManager.setMode(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeMode(isDark ? 'light' : 'dark');
  }, [isDark, setThemeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      isDark,
      colors,
      setThemeMode,
      toggleTheme,
    }),
    [themeMode, isDark, colors, setThemeMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
