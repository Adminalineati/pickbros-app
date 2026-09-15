'use client';

import type { MercadoPick, Pronostico, ResultadoPick, SeleccionPick } from '@pickbros/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authenticatedApiFetch } from '@/lib/local-auth';

const mercado: Record<MercadoPick, string> = {
  MONEYLINE: 'Ganador',
  EXACT_SCORE: 'Marcador exacto',
  TOTAL: 'Over / Under',
};
const seleccion: Record<SeleccionPick, string> = {
  HOME: 'Local',
  AWAY: 'Visitante',
  DRAW: 'Empate',
  OVER: 'Over',
  UNDER: 'Under',
};
const resultado: Record<ResultadoPick, string> = {
  PENDING: 'Pendiente',
  WIN: 'Ganado',
  LOSS: 'Fallado',
  VOID: 'Anulado',
};

export function PickHistory() {
  const [picks, setPicks] = useState<Pronostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    void authenticatedApiFetch('/picks', { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as Pronostico[] & {
          message?: string;
        };
        if (!response.ok) {
          throw new Error(body.message || 'No pudimos cargar tus pronósticos.');
        }
        setPicks(body);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'No pudimos cargar tus pronósticos.',
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-orange">
            Historial
          </p>
          <h1 className="mt-1 font-display text-4xl uppercase">Mis pronósticos</h1>
        </div>
        <Button asChild>
          <Link href="/deportes">Hacer otro pick</Link>
        </Button>
      </header>

      {loading ? <Card className="p-6 text-text-secondary">Cargando pronósticos…</Card> : null}
      {error ? <Card className="border-danger/30 p-6 text-danger">{error}</Card> : null}
      {!loading && !error && picks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-display text-2xl uppercase">Aún no tienes picks</p>
          <p className="mt-2 text-sm text-text-secondary">
            Elige un evento próximo para registrar tu primer pronóstico.
          </p>
        </Card>
      ) : null}

      <div className="space-y-3">
        {picks.map((pick) => (
          <Card className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto] md:items-center" key={pick.id}>
            <div>
              <p className="font-semibold">
                {pick.local} vs {pick.visitante}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {pick.liga} · {mercado[pick.mercado]} · {detalleSeleccion(pick)}
              </p>
              <p className="mt-1 text-[11px] text-text-secondary">ID: {pick.id}</p>
            </div>
            <p className="text-sm">
              <span className="text-text-secondary">Costo:</span>{' '}
              {pick.stakePickCoins} PickCoins
            </p>
            <span className="rounded-full border border-primary-blue/30 px-3 py-1 text-xs font-bold uppercase text-primary-blue">
              {resultado[pick.resultado]}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}

function detalleSeleccion(pick: Pronostico) {
  if (pick.mercado === 'EXACT_SCORE') {
    return `${pick.homeScore ?? 0} - ${pick.awayScore ?? 0}`;
  }
  if (pick.mercado === 'TOTAL') {
    return `${seleccion[pick.seleccion]} ${pick.totalLine ?? ''}`.trim();
  }
  return seleccion[pick.seleccion];
}
