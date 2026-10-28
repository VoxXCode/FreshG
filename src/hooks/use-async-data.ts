import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/types/api-error';
import { useNetworkStatus } from './use-network';

export interface AsyncDataOptions {
  /** Jumlah percobaan otomatis jika terjadi kegagalan jaringan (default: 2) */
  autoRetryCount?: number;
  /** Jeda waktu antar percobaan otomatis dalam milidetik (default: 1000) */
  autoRetryDelayMs?: number;
  /** Panggil ulang data otomatis saat koneksi internet kembali pulih (default: true) */
  autoRetryOnReconnect?: boolean;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: ApiError | null;
  isOffline: boolean;
  isRetrying: boolean;
  retryCount: number;
  retry: () => Promise<void>;
  refresh: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Helper untuk menjalankan panggilan asinkron dengan percobaan ulang otomatis (exponential backoff).
 */
async function fetchWithAutoRetry<R>(
  fetcher: () => Promise<R>,
  maxRetries: number,
  baseDelayMs: number,
  isCancelled: () => boolean,
): Promise<R> {
  let attempt = 0;
  while (true) {
    try {
      return await fetcher();
    } catch (err) {
      if (isCancelled()) {
        throw err;
      }
      attempt++;
      // Jika sudah melebihi batas retry atau error bukan masalah jaringan/server yang bisa dicoba lagi
      if (attempt > maxRetries) {
        throw err;
      }
      // Tunggu dengan jeda bertingkat (misal 1000ms, lalu 2000ms)
      await new Promise(resolve => setTimeout(resolve, baseDelayMs * attempt));
    }
  }
}

/**
 * Menjalankan `fetcher` saat mount atau retry dengan otomatisasi penuh:
 * 1. Otomatis coba lagi hingga 2x jika request gagal sebelum memunculkan error ke pengguna.
 * 2. Otomatis re-fetch saat koneksi internet pulih (Auto-retry on reconnect).
 * 3. Indikator loading, pull-to-refresh, dan retensi cache saat offline.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: AsyncDataOptions = {},
): AsyncState<T> {
  const {
    autoRetryCount = 2,
    autoRetryDelayMs = 1000,
    autoRetryOnReconnect = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const cancelledRef = useRef(false);
  const { isOffline: isCurrentOffline } = useNetworkStatus();
  const prevOfflineRef = useRef(isCurrentOffline);

  // Inisialisasi data saat mount dengan auto-retry
  useEffect(() => {
    cancelledRef.current = false;
    let isCancelled = false;

    fetchWithAutoRetry(
      fetcher,
      autoRetryCount,
      autoRetryDelayMs,
      () => isCancelled,
    )
      .then(res => {
        if (!isCancelled) {
          setData(res);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setError(ApiError.from(err));
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      cancelledRef.current = true;
    };
  }, [fetcher, autoRetryCount, autoRetryDelayMs]);

  // Fungsi Retry Manual / Event
  const retry = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    setIsRetrying(true);
    if (!data) {
      setLoading(true);
    }
    setError(null);

    try {
      const res = await fetchWithAutoRetry(
        fetcher,
        autoRetryCount,
        autoRetryDelayMs,
        () => cancelledRef.current,
      );
      if (!cancelledRef.current) {
        setData(res);
        setError(null);
      }
    } catch (err: unknown) {
      if (!cancelledRef.current) {
        setError(ApiError.from(err));
      }
    } finally {
      if (!cancelledRef.current) {
        setIsRetrying(false);
        setLoading(false);
      }
    }
  }, [fetcher, data, autoRetryCount, autoRetryDelayMs]);

  // Otomatisasi: Deteksi pulihnya koneksi internet (Offline -> Online)
  useEffect(() => {
    if (autoRetryOnReconnect) {
      // Jika sebelumnya offline dan sekarang internet kembali aktif
      if (prevOfflineRef.current && !isCurrentOffline) {
        // Otomatis panggil ulang data tanpa campur tangan pengguna
        void retry();
      }
    }
    prevOfflineRef.current = isCurrentOffline;
  }, [isCurrentOffline, autoRetryOnReconnect, retry]);

  // Fungsi Pull-to-refresh
  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetchWithAutoRetry(
        fetcher,
        1, // 1 kali retry untuk pull-to-refresh agar responsif
        800,
        () => cancelledRef.current,
      );
      if (!cancelledRef.current) {
        setData(res);
        setError(null);
      }
    } catch (err: unknown) {
      if (!cancelledRef.current) {
        setError(ApiError.from(err));
      }
    } finally {
      if (!cancelledRef.current) {
        setRefreshing(false);
      }
    }
  }, [fetcher]);

  const isOffline = error?.code === 'OFFLINE_ERROR' || isCurrentOffline;

  return {
    data,
    loading,
    refreshing,
    error,
    isOffline,
    isRetrying,
    retryCount,
    retry,
    refresh,
    setData,
  };
}
