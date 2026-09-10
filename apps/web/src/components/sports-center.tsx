'use client';

import type {
  EstadoEventoDeportivo,
  EventoDeportivo,
  LigaDeportiva,
} from '@pickbros/types';
import { CalendarDays, Clock3, Radio, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useSportsCalendar } from '@/lib/use-sports-calendar';
import { cn } from '@/lib/utils';

const leagueFilters: Array<'TODOS' | LigaDeportiva> = [
  'TODOS',
  'MLB',
  'NBA',
  'NFL',
  'Champions',
];
const statusFilters = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'PROXIMOS', label: 'Próximos' },
  { id: 'EN_VIVO', label: 'En vivo' },
  { id: 'RESULTADOS', label: 'Resultados' },
] as const;
type StatusFilter = (typeof statusFilters)[number]['id'];

const statusLabels: Record<EstadoEventoDeportivo, string> = {
  PROGRAMADO: 'Programado',
  EN_VIVO: 'En vivo',
  FINALIZADO: 'Final',
  POSPUESTO: 'Pospuesto',
  CANCELADO: 'Cancelado',
};

function localDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function dateLabel(value: string, timezone: string) {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(value));
}

function timeLabel(value: string, timezone: string) {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value));
}

function Team({
  name,
  code,
  logo,
  align = 'left',
}: {
  name: string;
  code: string;
  logo?: string;
  align?: 'left' | 'right';
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-3',
        align === 'right' && 'flex-row-reverse text-right',
      )}
    >
      <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-primary-blue/25 bg-background font-display text-xs text-primary-blue">
        {logo ? (
          <Image
            alt={`Logo de ${name}`}
            className="object-contain p-1.5"
            fill
            sizes="44px"
            src={logo}
          />
        ) : (
          code
        )}
      </span>
      <span className="truncate text-sm font-semibold text-text-primary">{name}</span>
    </div>
  );
}

function EventRow({ event, timezone }: { event: EventoDeportivo; timezone: string }) {
  const hasScore =
    event.marcadorLocal !== undefined && event.marcadorVisitante !== undefined;

  return (
    <Card className="grid gap-4 p-4 md:grid-cols-[110px_1fr_120px_1fr] md:items-center">
      <div>
        <Badge>{event.liga}</Badge>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
          <Clock3 aria-hidden="true" size={13} />
          {timeLabel(event.iniciaEn, timezone)}
        </p>
      </div>
      <Team
        code={event.local.codigo}
        logo={event.local.logoUrl}
        name={event.local.nombre}
      />
      <div className="text-center">
        <p
          className={cn(
            'font-display text-2xl text-text-primary',
            event.estado === 'EN_VIVO' && 'text-danger',
          )}
        >
          {hasScore ? `${event.marcadorLocal} – ${event.marcadorVisitante}` : 'VS'}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
          {statusLabels[event.estado]}
        </p>
      </div>
      <Team
        align="right"
        code={event.visitante.codigo}
        logo={event.visitante.logoUrl}
        name={event.visitante.nombre}
      />
      {(event.fase || event.sede) && (
        <p className="text-xs text-text-secondary md:col-start-2 md:col-span-3 md:text-center">
          {[event.fase, event.sede].filter(Boolean).join(' · ')}
        </p>
      )}
    </Card>
  );
}

export function SportsCenter() {
  const { data, error, loading, refreshing, refresh } = useSportsCalendar();
  const [league, setLeague] = useState<'TODOS' | LigaDeportiva>('TODOS');
  const [status, setStatus] = useState<StatusFilter>('TODOS');

  const groups = useMemo(() => {
    if (!data) return [];
    const visible = data.eventos.filter((event) => {
      if (league !== 'TODOS' && event.liga !== league) return false;
      if (status === 'PROXIMOS') return event.estado === 'PROGRAMADO';
      if (status === 'EN_VIVO') return event.estado === 'EN_VIVO';
      if (status === 'RESULTADOS') return event.estado === 'FINALIZADO';
      return true;
    });
    const grouped = new Map<string, EventoDeportivo[]>();
    for (const event of visible) {
      const day = localDate(event.iniciaEn, data.zonaHoraria);
      grouped.set(day, [...(grouped.get(day) ?? []), event]);
    }
    return [...grouped.entries()];
  }, [data, league, status]);

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-white/8 bg-surface-card p-5 md:p-7">
        <div className="absolute inset-x-0 top-0 h-px bg-primary-orange/70" />
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-orange">
              {data?.proveedor === 'highlightly'
                ? 'Datos deportivos · Highlightly'
                : 'Centro deportivo'}
            </p>
            <h1 className="mt-1 font-display text-4xl uppercase text-text-primary md:text-5xl">
              Calendario y resultados
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Horarios mostrados en tiempo de Ciudad de México. Resultados y próximos
              juegos de MLB, NBA, NFL y Champions League.
            </p>
          </div>
          {data ? (
            <button
              className="flex items-center gap-2 text-xs text-text-secondary transition hover:text-primary-orange disabled:opacity-50"
              disabled={refreshing}
              onClick={refresh}
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={refreshing ? 'animate-spin' : undefined}
                size={13}
              />
              Actualizado{' '}
              {new Intl.DateTimeFormat('es-MX', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: data.zonaHoraria,
              }).format(new Date(data.actualizadoEn))}
            </button>
          ) : null}
        </div>
      </header>

      <section className="space-y-3" aria-label="Filtros del calendario">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {leagueFilters.map((value) => (
            <button
              className={cn(
                'shrink-0 rounded-full border border-primary-blue/25 bg-background px-4 py-2 text-sm text-text-secondary transition',
                league === value &&
                  'border-primary-orange bg-primary-orange/15 text-primary-orange',
              )}
              key={value}
              onClick={() => setLeague(value)}
              type="button"
            >
              {value === 'TODOS' ? 'Todos los deportes' : value}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((item) => (
            <button
              className={cn(
                'shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-text-secondary',
                status === item.id && 'bg-primary-orange/15 text-primary-orange',
              )}
              key={item.id}
              onClick={() => setStatus(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {data ? (
        <div className="flex flex-wrap gap-2">
          {data.fuentes.map((source) => (
            <span
              className={cn(
                'rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                source.ok
                  ? 'border-success/30 text-success'
                  : 'border-text-secondary/20 text-text-secondary',
              )}
              key={source.liga}
              title={source.error}
            >
              {source.liga} · {source.eventos}
            </span>
          ))}
        </div>
      ) : null}

      {loading ? (
        <Card className="flex items-center gap-3 p-6 text-text-secondary">
          <RefreshCw className="animate-spin" aria-hidden="true" size={18} />
          Cargando calendarios…
        </Card>
      ) : null}

      {error ? <Card className="border-danger/30 p-6 text-danger">{error}</Card> : null}

      {!loading && !error && groups.length === 0 ? (
        <Card className="p-8 text-center">
          <CalendarDays
            className="mx-auto text-primary-blue"
            aria-hidden="true"
            size={32}
          />
          <p className="mt-3 font-display text-2xl uppercase text-text-primary">
            No hay eventos en este filtro
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Cambia de deporte o estado. Los calendarios se actualizan cada seis horas.
          </p>
        </Card>
      ) : null}

      {groups.map(([day, events]) => (
        <section className="space-y-3" key={day}>
          <h2 className="flex items-center gap-2 font-display text-xl uppercase text-text-primary">
            {events.some((event) => event.estado === 'EN_VIVO') ? (
              <Radio className="text-danger" aria-hidden="true" size={18} />
            ) : (
              <CalendarDays
                className="text-primary-orange"
                aria-hidden="true"
                size={18}
              />
            )}
            {dateLabel(events[0]!.iniciaEn, data?.zonaHoraria ?? 'UTC')}
          </h2>
          <div className="space-y-3">
            {events.map((event) => (
              <EventRow
                event={event}
                key={event.id}
                timezone={data?.zonaHoraria ?? 'UTC'}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
