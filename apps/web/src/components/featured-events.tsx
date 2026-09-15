'use client';

import type { EventoDestacado } from '@pickbros/types';
import { EventCard } from '@/components/event-card';
import { SectionHeader } from '@/components/section-header';
import { eventosDestacados } from '@/lib/sports-data';
import { useSportsCalendar } from '@/lib/use-sports-calendar';
import { useSportsOdds } from '@/lib/use-sports-odds';

export function FeaturedEvents({ eventos }: { eventos: EventoDestacado[] }) {
  const { data } = useSportsCalendar();
  const liveEvents = data ? eventosDestacados(data) : [];
  const visibleEvents = liveEvents.length ? liveEvents : eventos;
  const { odds } = useSportsOdds(data?.eventos);

  return (
    <section aria-labelledby="eventos-titulo">
      <SectionHeader id="eventos-titulo" kicker="Agenda" title="Eventos destacados" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {visibleEvents.map((evento) => (
          <EventCard key={evento.id} evento={evento} odds={odds[evento.id]} />
        ))}
      </div>
    </section>
  );
}
