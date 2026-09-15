'use client';

import type {
  MercadoPick,
  Pronostico,
  SeleccionPick,
} from '@pickbros/types';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  authenticatedApiFetch,
  currentUser,
  patchSessionUser,
} from '@/lib/local-auth';
import { formatearAmerican } from '@/lib/odds-format';
import { useSportsCalendar } from '@/lib/use-sports-calendar';
import { useSportsOdds } from '@/lib/use-sports-odds';

const etiquetasMercado: Record<MercadoPick, string> = {
  MONEYLINE: 'Ganador del evento',
  EXACT_SCORE: 'Marcador exacto',
  TOTAL: 'Over / Under',
};

export function PickForm() {
  const params = useSearchParams();
  const eventId = params.get('eventId');
  const { data, loading } = useSportsCalendar();
  const event = useMemo(
    () => data?.eventos.find((item) => item.id === eventId),
    [data, eventId],
  );
  const { odds } = useSportsOdds(event ? [event] : undefined);
  const eventOdds = event ? odds[event.id] : undefined;
  const [market, setMarket] = useState<MercadoPick>('MONEYLINE');
  const [selection, setSelection] = useState<SeleccionPick>('HOME');
  const [stake, setStake] = useState(30);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [totalLine, setTotalLine] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Pronostico | null>(null);

  useEffect(() => {
    const line = eventOdds?.markets.total?.line;
    if (line !== undefined) setTotalLine(line);
  }, [eventOdds?.markets.total?.line]);

  if (loading) {
    return <Card className="p-6 text-text-secondary">Cargando evento…</Card>;
  }

  if (!eventId || !event) {
    return (
      <Card className="p-6">
        <h1 className="font-display text-3xl uppercase">Elige un evento</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Abre el centro deportivo y selecciona “Hacer pick” en un evento próximo.
        </p>
        <Button asChild className="mt-5">
          <Link href="/deportes">Ver eventos deportivos</Link>
        </Button>
      </Card>
    );
  }

  if (created) {
    return (
      <Card className="border-success/30 p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-success">
          Pronóstico confirmado
        </p>
        <h1 className="mt-2 font-display text-3xl uppercase">
          {event.local.nombre} vs {event.visitante.nombre}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Identificador: <span className="text-text-primary">{created.id}</span>
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Saldo disponible: {created.pickCoins ?? 0} PickCoins
        </p>
        <Button asChild className="mt-5">
          <Link href="/picks">Ver mis pronósticos</Link>
        </Button>
      </Card>
    );
  }

  const hasDraw = eventOdds?.markets.moneyline?.draw !== undefined;
  const drawOdds = eventOdds?.markets.moneyline?.draw;
  const marketOptions: MercadoPick[] = ['MONEYLINE', 'EXACT_SCORE', 'TOTAL'];

  async function submit() {
    if (!event) return;
    const user = currentUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    let finalSelection = selection;
    if (market === 'EXACT_SCORE') {
      finalSelection =
        homeScore === awayScore ? 'DRAW' : homeScore > awayScore ? 'HOME' : 'AWAY';
    }
    if (market === 'TOTAL' && totalLine === '') {
      setError('Indica la línea de Over / Under.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await authenticatedApiFetch('/picks', {
        method: 'POST',
        body: JSON.stringify({
          eventId: event.id,
          liga: event.liga,
          localNombre: event.local.nombre,
          localCodigo: event.local.codigo,
          visitanteNombre: event.visitante.nombre,
          visitanteCodigo: event.visitante.codigo,
          iniciaEn: event.iniciaEn,
          estado: event.estado,
          mercado: market,
          seleccion: finalSelection,
          stakePickCoins: stake,
          ...(market === 'EXACT_SCORE' ? { homeScore, awayScore } : {}),
          ...(market === 'TOTAL' ? { totalLine } : {}),
        }),
      });
      const body = (await response.json()) as Pronostico & { message?: string | string[] };
      if (!response.ok) {
        throw new Error(
          Array.isArray(body.message)
            ? body.message.join('. ')
            : body.message || 'No pudimos registrar tu pronóstico.',
        );
      }
      patchSessionUser({ pickCoins: body.pickCoins });
      setCreated(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos registrar tu pronóstico.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-orange">
          Nuevo pronóstico
        </p>
        <h1 className="mt-1 font-display text-4xl uppercase">
          {event.local.nombre} vs {event.visitante.nombre}
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          El pronóstico queda bloqueado al comenzar el evento.
        </p>
      </header>

      <Card className="space-y-5 p-5">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Tipo de pronóstico</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {marketOptions.map((option) => (
              <button
                className={`rounded-xl border p-3 text-left text-sm ${
                  market === option
                    ? 'border-primary-orange bg-primary-orange/10 text-primary-orange'
                    : 'border-white/10 text-text-secondary'
                }`}
                key={option}
                onClick={() => {
                  setMarket(option);
                  setSelection(option === 'TOTAL' ? 'OVER' : 'HOME');
                }}
                type="button"
              >
                {etiquetasMercado[option]}
              </button>
            ))}
          </div>
        </fieldset>

        {market === 'MONEYLINE' ? (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Tu selección</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              <SelectionButton
                active={selection === 'HOME'}
                label={event.local.nombre}
                meta={teamMeta(eventOdds?.homeTeam.marketPosition, eventOdds?.markets.moneyline?.home)}
                onClick={() => setSelection('HOME')}
              />
              <SelectionButton
                active={selection === 'AWAY'}
                label={event.visitante.nombre}
                meta={teamMeta(eventOdds?.awayTeam.marketPosition, eventOdds?.markets.moneyline?.away)}
                onClick={() => setSelection('AWAY')}
              />
              {hasDraw ? (
                <SelectionButton
                  active={selection === 'DRAW'}
                  label="Empate"
                  meta={drawOdds === undefined ? undefined : formatearAmerican(drawOdds)}
                  onClick={() => setSelection('DRAW')}
                />
              ) : null}
            </div>
          </fieldset>
        ) : null}

        {market === 'EXACT_SCORE' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField label={`Goles/puntos de ${event.local.nombre}`} value={homeScore} onChange={setHomeScore} />
            <NumberField label={`Goles/puntos de ${event.visitante.nombre}`} value={awayScore} onChange={setAwayScore} />
          </div>
        ) : null}

        {market === 'TOTAL' ? (
          <div className="space-y-3">
            <label className="block text-sm font-semibold">
              Línea total
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-background p-3"
                min="0"
                onChange={(e) => setTotalLine(e.target.value === '' ? '' : Number(e.target.value))}
                step="0.5"
                type="number"
                value={totalLine}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <SelectionButton active={selection === 'OVER'} label="Over" onClick={() => setSelection('OVER')} />
              <SelectionButton active={selection === 'UNDER'} label="Under" onClick={() => setSelection('UNDER')} />
            </div>
          </div>
        ) : null}

        <label className="block text-sm font-semibold">
          PickCoins a usar
          <input
            className="mt-2 w-full rounded-xl border border-white/10 bg-background p-3"
            max="100"
            min="30"
            onChange={(e) => setStake(Number(e.target.value))}
            step="1"
            type="number"
            value={stake}
          />
        </label>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button className="w-full" disabled={saving} onClick={submit}>
          {saving ? 'Confirmando…' : `Confirmar pick por ${stake} PickCoins`}
        </Button>
      </Card>
    </div>
  );
}

function teamMeta(position?: string, odds?: number) {
  return [position === 'favorito' ? 'Favorito' : position === 'underdog' ? 'Underdog' : position === 'even' ? 'Parejo' : '', odds === undefined ? '' : formatearAmerican(odds)]
    .filter(Boolean)
    .join(' · ');
}

function SelectionButton({
  active,
  label,
  meta,
  onClick,
}: {
  active: boolean;
  label: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-xl border p-3 text-left ${
        active
          ? 'border-primary-blue bg-primary-blue/10'
          : 'border-white/10'
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="block text-sm font-semibold">{label}</span>
      {meta ? <span className="mt-1 block text-xs text-text-secondary">{meta}</span> : null}
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input
        className="mt-2 w-full rounded-xl border border-white/10 bg-background p-3"
        max="99"
        min="0"
        onChange={(e) => onChange(Number(e.target.value))}
        type="number"
        value={value}
      />
    </label>
  );
}
