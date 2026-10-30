/**
 * API State Components – FreshG (Sprint 05: UI States & Error Handling)
 *
 * Mengimplementasikan 5 kondisi state sesuai panduan Sprint 05 (Slide 3 & 5):
 * 1. Loading State (Memuat data... / Mencoba lagi...)
 * 2. Success State (Menampilkan konten anak / children)
 * 3. Error State (Pesan error HTTP 4xx, 5xx, atau network)
 * 4. Empty State (Tampilan ketika tidak ada data)
 * 5. Offline & Timeout State (Ikon wifi mati / jam timeout)
 * Dilengkapi tombol "Coba Lagi" (Retry Mechanism) di setiap kondisi gagal.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ApiError } from '@/types/api-error';

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  primary:            '#006c49',
  onPrimary:          '#ffffff',
  surface:            '#f8f9ff',
  surfaceContainer:   '#e5eeff',
  surfaceLowest:      '#ffffff',
  onSurface:          '#0b1c30',
  onSurfaceVariant:   '#3c4a42',
  outline:            '#6c7a71',
  error:              '#ba1a1a',
  errorContainer:     '#ffdad6',
  onErrorContainer:   '#93000a',
  tertiary:           '#855300',
  tertiaryContainer:  '#ffddb8',
};

// ─── 1. Loading State View ────────────────────────────────────────────────────
export function LoadingStateView({
  isRetrying = false,
  message,
}: {
  isRetrying?: boolean;
  message?: string;
}) {
  return (
    <View style={s.container}>
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={s.stateTitle}>{isRetrying ? 'Mencoba lagi...' : 'Memuat data...'}</Text>
        <Text style={s.stateSub}>
          {message || (isRetrying ? 'Mengambil data terbaru dari server...' : 'Mohon tunggu sebentar')}
        </Text>
      </View>
    </View>
  );
}

// ─── 2. Error State View (4xx, 5xx, Network) ──────────────────────────────────
export function ErrorStateView({
  error,
  onRetry,
}: {
  error: ApiError | Error | null;
  onRetry?: () => void;
}) {
  const isApiErr = error instanceof ApiError;
  const isOffline = isApiErr && error.type === 'OFFLINE';
  const isTimeout = isApiErr && error.type === 'TIMEOUT';
  const statusCode = isApiErr ? error.statusCode : undefined;

  // Judul & Ikon dinamis sesuai jenis error (Slide 9 & 10)
  let title = 'Gagal Mengambil Data';
  let iconName: 'error' | 'wifi-off' | 'access-time' = 'error';
  let defaultMsg = 'Terjadi kesalahan pada server. Silakan coba lagi.';

  if (isOffline) {
    title = 'Tidak Ada Koneksi Internet';
    iconName = 'wifi-off';
    defaultMsg = 'Periksa koneksi Anda dan coba lagi.';
  } else if (isTimeout) {
    title = 'Waktu Habis (Timeout)';
    iconName = 'access-time';
    defaultMsg = 'Server terlalu lama merespons. Silakan coba lagi.';
  } else if (statusCode === 404) {
    title = 'Data Tidak Ditemukan (404)';
    defaultMsg = 'Data program atau bahan yang dicari tidak tersedia.';
  } else if (statusCode === 401) {
    title = 'Akses Ditolak (401)';
    defaultMsg = 'Sesi Anda telah berakhir. Silakan login kembali.';
  } else if (statusCode && statusCode >= 500) {
    title = `Terjadi Kesalahan Server (${statusCode})`;
    defaultMsg = 'Server sedang mengalami gangguan. Silakan coba lagi nanti.';
  }

  const message = isApiErr ? error.userFriendlyMessage : (error?.message || defaultMsg);

  return (
    <View style={s.container}>
      <View style={s.card}>
        <View style={[s.iconBadge, isOffline ? s.iconBadgeOffline : s.iconBadgeError]}>
          <MaterialIcons name={iconName} size={36} color={C.onPrimary} />
        </View>

        <Text style={s.errorTitle}>{title}</Text>
        <Text style={s.errorDesc}>{message}</Text>

        {onRetry && (
          <TouchableOpacity style={s.retryBtn} onPress={onRetry} activeOpacity={0.8}>
            <MaterialIcons name="refresh" size={20} color={C.onPrimary} />
            <Text style={s.retryBtnTxt}>Coba Lagi</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── 3. Empty State View ──────────────────────────────────────────────────────
export function EmptyStateView({
  title = 'Belum Ada Data',
  message = 'Belum ada data yang tersedia saat ini.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={s.container}>
      <View style={s.card}>
        <View style={s.iconBadgeEmpty}>
          <MaterialCommunityIcons name="inbox-remove-outline" size={36} color={C.outline} />
        </View>

        <Text style={s.emptyTitle}>{title}</Text>
        <Text style={s.emptyDesc}>{message}</Text>

        {onRetry && (
          <TouchableOpacity style={s.retryBtnOutline} onPress={onRetry} activeOpacity={0.8}>
            <MaterialIcons name="refresh" size={18} color={C.primary} />
            <Text style={s.retryBtnOutlineTxt}>Muat Ulang</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── 4. Boundary Wrapper Component ───────────────────────────────────────────
export interface ApiStateViewProps {
  loading: boolean;
  isRetrying?: boolean;
  error: ApiError | Error | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function ApiStateView({
  loading,
  isRetrying = false,
  error,
  isEmpty = false,
  emptyTitle,
  emptyMessage,
  onRetry,
  children,
}: ApiStateViewProps) {
  if (loading && !isRetrying) {
    return <LoadingStateView isRetrying={false} />;
  }

  if (error) {
    return <ErrorStateView error={error} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return <EmptyStateView title={emptyTitle} message={emptyMessage} onRetry={onRetry} />;
  }

  return <>{children}</>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: C.surfaceLowest,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.surfaceContainer,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.onSurface,
    marginTop: 8,
  },
  stateSub: {
    fontSize: 13,
    color: C.outline,
    textAlign: 'center',
  },
  iconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconBadgeError: {
    backgroundColor: C.error,
  },
  iconBadgeOffline: {
    backgroundColor: '#7c3aed', // Ungu khas indikator koneksi di slide 11
  },
  iconBadgeEmpty: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 13,
    color: C.outline,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.onSurface,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: C.outline,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.error,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    shadowColor: C.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  retryBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: C.onPrimary,
  },
  retryBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: C.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: C.surfaceLowest,
  },
  retryBtnOutlineTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
  },
});

