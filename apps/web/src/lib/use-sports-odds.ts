'use client';

import type {
  CuotasAsociadasRespuesta,
  EventoCuotas,
  EventoDeportivo,
} from '@pickbros/types';
import { useEffect, useMemo, useState } from 'react';

const REFRESH_INTERVAL_MS = 60_000;

function apiUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');
}

export function useSportsOdds(eventos: EventoDeportivo[] = []) {
  const [odds, setOdds] = useState<Record<string, EventoCuotas>>({});
  const [available, setAvailable] = useState(false);
  const [unavailableReason, setUnavailableReason] = useState('');
  const [loading, setLoading] = useState(false);

  const payload = useMemo(
    () =>
      eventos.map((event) => ({
        id: event.id,
        liga: event.liga,
        localNombre: event.local.nombre,
        visitanteNombre: event.visitante.nombre,
        iniciaEn: event.iniciaEn,
      })),
    [eventos],
  );
  const signature = useMemo(() => JSON.stringify(payload), [payload]);

  useEffect(() => {
    const base = apiUrl();
    if (!base || payload.length === 0) {
      setOdds({});
      setAvailable(false);
      setUnavailableReason(
        base ? '' : 'Cuotas no disponibles fuera del API local.',
      );
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${base}/cuotas/asociar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventos: payload }),
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Odds currently unavailable');
        }
        const body = (await response.json()) as CuotasAsociadasRespuesta;
        if (controller.signal.aborted) return;
        setOdds(body.eventos ?? {});
        setAvailable(body.available);
        setUnavailableReason(body.available ? '' : 'Cuotas no disponibles');
      } catch (cause) {
        if (controller.signal.aborted) return;
        setOdds({});
        setAvailable(false);
        setUnavailableReason(
          cause instanceof Error ? 'Cuotas no disponibles' : 'Cuotas no disponibles',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, REFRESH_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [payload, signature]);

  return { odds, available, unavailableReason, loading };
}
