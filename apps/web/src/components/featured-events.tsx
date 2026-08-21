import type { EventoDestacado } from '@pickbros/types';
import { EventCard } from '@/components/event-card';
import { SectionHeader } from '@/components/section-header';

export function FeaturedEvents({ eventos }: { eventos: EventoDestacado[] }) {
  return (
    <section aria-labelledby="eventos-titulo">
      <SectionHeader id="eventos-titulo" kicker="Agenda" title="Eventos destacados" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {eventos.map((evento) => (
          <EventCard key={evento.id} evento={evento} />
        ))}
      </div>
    </section>
  );
}
