/**
 * Async Data Hook – FreshG (Sprint 05: Loading, Error & Retry Mechanism)
 *
 * Mengelola siklus hidup request API:
 * - Loading state & Retrying indicator (Task 02)
 * - Success state (data tersimpan)
 * - Error state (menangkap 4xx, 5xx, timeout, dan offline)
 * - Retry function (refetch) untuk mencoba request kembali
 */
import { useEffect, useState, useCallback } from 'react';
import type { ApiError } from '@/types/api-error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  isRetrying: boolean;
  error: ApiError | Error | null;
  refetch: () => Promise<void>;
}

export function useAsyncData<T>(fetcher: () => Promise<T>): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | Error | null>(null);

  const execute = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setIsRetrying(true);
    }
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (e: unknown) {
      const errObj = e instanceof Error ? e : new Error(String(e));
      setError(errObj);
      setData(null);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [fetcher]);

  useEffect(() => {
    let cancelled = false;

    const initialLoad = async () => {
      try {
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  const refetch = useCallback(async () => {
    await execute(true);
  }, [execute]);

  return {
    data,
    loading,
    isRetrying,
    error,
    refetch,
  };
}
