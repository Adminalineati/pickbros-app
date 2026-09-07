'use client';

import type { CalendarioDeportivo } from '@pickbros/types';
import { useEffect, useState } from 'react';
import { cargarCalendarioDeportivo } from '@/lib/sports-data';

export function useSportsCalendar() {
  const [data, setData] = useState<CalendarioDeportivo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    cargarCalendarioDeportivo(controller.signal)
      .then((calendar) => {
        setData(calendar);
        setError('');
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : 'No pudimos cargar los eventos deportivos.',
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { data, error, loading };
}
