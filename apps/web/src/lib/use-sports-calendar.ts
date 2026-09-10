'use client';

import type { CalendarioDeportivo } from '@pickbros/types';
import { useCallback, useEffect, useState } from 'react';
import { cargarCalendarioDeportivo } from '@/lib/sports-data';

const REFRESH_INTERVAL_MS = 2 * 60 * 1000;

export function useSportsCalendar() {
  const [data, setData] = useState<CalendarioDeportivo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (signal?: AbortSignal, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const calendar = await cargarCalendarioDeportivo(signal);
      if (signal?.aborted) return;
      setData(calendar);
      setError('');
    } catch (cause) {
      if (signal?.aborted) return;
      setError(
        cause instanceof Error
          ? cause.message
          : 'No pudimos cargar los eventos deportivos.',
      );
    } finally {
      if (signal?.aborted) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);

    const interval = window.setInterval(() => {
      void load(undefined, true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [load]);

  const refresh = useCallback(() => {
    void load(undefined, true);
  }, [load]);

  return { data, error, loading, refreshing, refresh };
}
