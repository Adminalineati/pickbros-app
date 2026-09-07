import type { EventoDestacado } from '@pickbros/types';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ligaColor: Record<EventoDestacado['liga'], string> = {
  MLB: 'border-primary-blue/40 text-primary-blue',
  NBA: 'border-primary-orange/40 text-primary-orange',
  NFL: 'border-success/40 text-success',
  Champions: 'border-text-secondary/40 text-text-secondary',
};

function TeamBadge({
  logo,
  initials,
  name,
  accent,
}: {
  logo?: string;
  initials: string;
  name: string;
  accent: 'blue' | 'orange';
}) {
  const colors =
    accent === 'blue'
      ? 'border-primary-blue/35 bg-primary-blue/10 text-primary-blue'
      : 'border-primary-orange/35 bg-primary-orange/10 text-primary-orange';

  return (
    <span
      className={`relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border font-display text-xs ${colors}`}
    >
      {logo ? (
        <Image
          alt={`Logo de ${name}`}
          className="object-contain p-1"
          fill
          sizes="40px"
          src={logo}
        />
      ) : (
        initials
      )}
    </span>
  );
}

export function EventCard({ evento }: { evento: EventoDestacado }) {
  const hasScore =
    evento.marcadorLocal !== undefined && evento.marcadorVisitante !== undefined;

  return (
    <Card className="flex h-full flex-col gap-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary-orange/45 hover:shadow-[0_0_24px_color-mix(in_srgb,var(--primary-orange)_10%,transparent)]">
      <div className="flex items-center justify-between gap-2">
        <Badge className={ligaColor[evento.liga]}>{evento.liga}</Badge>
        {evento.estado === 'EN_VIVO' ? (
          <span className="text-[10px] font-bold uppercase tracking-wider text-danger">
            ● En vivo
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TeamBadge
            accent="blue"
            initials={evento.inicialesLocal}
            logo={evento.logoLocal}
            name={evento.local}
          />
          <span className="text-sm font-semibold">{evento.local}</span>
        </div>
        <span className="font-display text-lg text-text-secondary">
          {hasScore ? `${evento.marcadorLocal}–${evento.marcadorVisitante}` : 'vs'}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{evento.visitante}</span>
          <TeamBadge
            accent="orange"
            initials={evento.inicialesVisitante}
            logo={evento.logoVisitante}
            name={evento.visitante}
          />
        </div>
      </div>
      <p className="text-sm text-text-secondary">{evento.horario}</p>
      <Button asChild variant="outline" size="sm" className="mt-auto w-full">
        <Link
          href="/deportes"
          aria-label={`Ver calendario de ${evento.local} contra ${evento.visitante}`}
        >
          Ver calendario
        </Link>
      </Button>
    </Card>
  );
}
