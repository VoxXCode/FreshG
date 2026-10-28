/**
 * Palet warna tema FreshG untuk Mode Terang (Light) dan Mode Gelap (Dark).
 * Memenuhi standar Material Design 3 dan WCAG Contrast untuk keterbacaan optimal.
 */

export interface FreshGColors {
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerLow: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceLowest: string;
  surfaceBright: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  error: string;
  errorContainer: string;
  onErrorContainer: string;
  tertiary: string;
  tertiaryContainer: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  onTertiaryContainer: string;
  background: string;
  card: string;
  border: string;
}

export const lightColors: FreshGColors = {
  primary: '#006c49',
  primaryContainer: '#10b981',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#00422b',
  secondary: '#006c4a',
  secondaryContainer: '#82f5c1',
  onSecondaryContainer: '#00714e',
  surface: '#f8f9ff',
  surfaceContainer: '#e5eeff',
  surfaceContainerLow: '#eff4ff',
  surfaceContainerHigh: '#dce9ff',
  surfaceContainerHighest: '#d3e4fe',
  surfaceLowest: '#ffffff',
  surfaceBright: '#ffffff',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#3c4a42',
  outline: '#6c7a71',
  outlineVariant: '#bbcabf',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
  tertiary: '#855300',
  tertiaryContainer: '#e29100',
  tertiaryFixed: '#ffddb8',
  tertiaryFixedDim: '#ffb95f',
  onTertiaryContainer: '#523200',
  background: '#f8f9ff',
  card: '#ffffff',
  border: '#e2e8f0',
};

export const darkColors: FreshGColors = {
  primary: '#10b981',
  primaryContainer: '#064e3b',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#a7f3d0',
  secondary: '#34d399',
  secondaryContainer: '#065f46',
  onSecondaryContainer: '#a7f3d0',
  surface: '#090d16',
  surfaceContainer: '#151d2f',
  surfaceContainerLow: '#070a12',
  surfaceContainerHigh: '#243048',
  surfaceContainerHighest: '#334155',
  surfaceLowest: '#131b2c',
  surfaceBright: '#243048',
  onSurface: '#f1f5f9',
  onSurfaceVariant: '#94a3b8',
  outline: '#64748b',
  outlineVariant: '#222f46',
  error: '#f87171',
  errorContainer: '#450a0a',
  onErrorContainer: '#fecaca',
  tertiary: '#fbbf24',
  tertiaryContainer: '#78350f',
  tertiaryFixed: '#ffddb8',
  tertiaryFixedDim: '#ffb95f',
  onTertiaryContainer: '#fef3c7',
  background: '#090d16',
  card: '#131b2c',
  border: '#222f46',
};
