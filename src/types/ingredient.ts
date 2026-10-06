/**
 * Types and constants for FreshG ingredient management
 */

export type Category =
  | 'Sayuran'
  | 'Buah-buahan'
  | 'Bumbu Dapur'
  | 'Daging & Olahan'
  | 'Susu & Telur'
  | 'Herbal'
  | 'Kering';

export type StorageLocation = 'Kulkas' | 'Freezer' | 'Suhu Ruang' | 'Lemari';

export type FreshnessStatus = 'fresh' | 'warning' | 'expiring' | 'expired';

export type IngredientStatus = 'active' | 'used' | 'discarded';

export interface Ingredient {
  id: string;
  name: string;
  category: Category;
  storageLocation: StorageLocation;
  addedDate: Date;
  expiryDate: Date;
  totalDays: number; // total estimated shelf life in days
  status: IngredientStatus;
  quantity?: string;
  note?: string; // catatan penyimpanan, mis. "Crisper drawer sayur"
}

export const CATEGORIES: Category[] = [
  'Sayuran',
  'Buah-buahan',
  'Bumbu Dapur',
  'Daging & Olahan',
  'Susu & Telur',
  'Herbal',
  'Kering',
];

export const STORAGE_LOCATIONS: StorageLocation[] = [
  'Kulkas',
  'Freezer',
  'Suhu Ruang',
  'Lemari',
];

export type FreshnessConfig = {
  color: string;
  bgColor: string;
  dotColor: string;
  label: string;
  barColor: string;
};

export const FRESHNESS_CONFIG: Record<FreshnessStatus, FreshnessConfig> = {
  fresh: {
    color: '#006c49',
    bgColor: 'rgba(130,245,193,0.35)',
    dotColor: '#006c49',
    label: 'Segar',
    barColor: '#10b981',
  },
  warning: {
    color: '#855300',
    bgColor: 'rgba(255,221,184,0.5)',
    dotColor: '#855300',
    label: 'Perhatian',
    barColor: '#e29100',
  },
  expiring: {
    color: '#93000a',
    bgColor: 'rgba(255,218,214,0.6)',
    dotColor: '#ba1a1a',
    label: 'Segera Olah',
    barColor: '#ba1a1a',
  },
  expired: {
    color: '#6c7a71',
    bgColor: '#f3f4f6',
    dotColor: '#6c7a71',
    label: 'Kedaluwarsa',
    barColor: '#9ca3af',
  },
};

export const STORAGE_TIPS: { category: string; tip: string; icon: string }[] = [
  {
    category: 'Herbal & Sayur',
    tip: 'Bungkus batang seledri atau daun herbal dengan tisu dapur basah sebelum masuk kulkas agar tetap renyah hingga 2 minggu.',
    icon: 'leaf',
  },
  {
    category: 'Buah-buahan',
    tip: 'Simpan pisang secara terpisah dari buah lain. Etilen yang dihasilkan pisang dapat mempercepat pematangan buah sekitarnya.',
    icon: 'fruit-grapes',
  },
  {
    category: 'Daging',
    tip: 'Bungkus daging dengan plastik kedap udara dan bekukan dalam porsi sekali pakai agar mudah dicairkan sesuai kebutuhan.',
    icon: 'food-steak',
  },
  {
    category: 'Bumbu Dapur',
    tip: 'Simpan bawang merah dan putih di tempat yang sejuk, kering, dan berventilasi baik — jangan di kulkas agar tidak cepat busuk.',
    icon: 'chili-mild',
  },
  {
    category: 'Susu & Telur',
    tip: 'Letakkan telur di rak dalam kulkas, bukan di pintu. Fluktuasi suhu pintu kulkas dapat memperpendek umur telur.',
    icon: 'egg',
  },
];

/** Estimated shelf-life in days per category × storage location */
export const DEFAULT_EXPIRY_DAYS: Record<Category, Record<StorageLocation, number>> = {
  'Sayuran':         { Kulkas: 7,   Freezer: 90,  'Suhu Ruang': 3,   Lemari: 2   },
  'Buah-buahan':     { Kulkas: 10,  Freezer: 60,  'Suhu Ruang': 5,   Lemari: 3   },
  'Bumbu Dapur':     { Kulkas: 14,  Freezer: 180, 'Suhu Ruang': 30,  Lemari: 60  },
  'Daging & Olahan': { Kulkas: 2,   Freezer: 180, 'Suhu Ruang': 1,   Lemari: 1   },
  'Susu & Telur':    { Kulkas: 14,  Freezer: 60,  'Suhu Ruang': 2,   Lemari: 1   },
  'Herbal':          { Kulkas: 10,  Freezer: 60,  'Suhu Ruang': 3,   Lemari: 2   },
  'Kering':          { Kulkas: 180, Freezer: 365, 'Suhu Ruang': 180, Lemari: 365 },
};

export function getFreshnessStatus(expiryDate: Date): FreshnessStatus {
  const diffDays = getDaysUntilExpiry(expiryDate);
  if (diffDays < 0)  return 'expired';
  if (diffDays <= 1) return 'expiring';
  if (diffDays <= 3) return 'warning';
  return 'fresh';
}

export function getDaysUntilExpiry(expiryDate: Date): number {
  return Math.ceil((expiryDate.getTime() - Date.now()) / 86_400_000);
}

export function getFreshnessPercent(daysLeft: number, totalDays: number): number {
  if (totalDays <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((daysLeft / totalDays) * 100)));
}
