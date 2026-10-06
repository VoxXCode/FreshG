import { useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Menjalankan `fetcher` sekali saat mount dan menyimpan hasilnya di state.
 * `fetcher` harus stabil (didefinisikan di luar komponen).
 */
export function useAsyncData<T>(fetcher: () => Promise<T>): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({ data: null, loading: false, error: e instanceof Error ? e : new Error(String(e)) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  return state;
}
