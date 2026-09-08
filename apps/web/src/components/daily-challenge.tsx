'use client';

import type { ChallengeDelDia } from '@pickbros/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatearNumero } from '@/lib/format';
import { challengeDesdeCalendario } from '@/lib/sports-data';
import { useSportsCalendar } from '@/lib/use-sports-calendar';

function Escudo({
  iniciales,
  acento,
  nombre,
  logo,
}: {
  iniciales: string;
  acento: string;
  nombre: string;
  logo?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 font-display text-2xl text-white shadow-[0_0_24px_color-mix(in_srgb,var(--primary-blue)_25%,transparent)] md:h-24 md:w-24 md:text-3xl"
        style={{ borderColor: acento, background: `${acento}22` }}
        aria-hidden="true"
      >
        {logo ? (
          <Image alt="" className="object-contain p-2" fill sizes="96px" src={logo} />
        ) : (
          iniciales
        )}
      </span>
      <p className="font-display text-lg uppercase tracking-wide md:text-xl">{nombre}</p>
    </div>
  );
}

export function DailyChallenge({ challenge }: { challenge: ChallengeDelDia }) {
  const { data } = useSportsCalendar();
  const visible = (data && challengeDesdeCalendario(data)) || challenge;

  return (
    <Card className="relative overflow-hidden border-primary-orange/35 bg-gradient-to-br from-primary-blue/10 via-surface to-primary-orange/10 p-5 shadow-[0_0_34px_color-mix(in_srgb,var(--primary-blue)_12%,transparent),0_0_34px_color-mix(in_srgb,var(--primary-orange)_10%,transparent)] md:p-8">
      <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-primary-blue/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-orange/15 blur-3xl" />
      <p className="relative text-[11px] font-bold uppercase tracking-[0.22em] text-primary-orange">
        {visible.titulo}
      </p>
      <h2 className="relative mt-2 font-display text-3xl uppercase tracking-wide md:text-5xl">
        {visible.pregunta}
      </h2>
      <div className="relative mt-8 flex items-center justify-center gap-4 md:gap-10">
        <Escudo
          nombre={visible.local.nombre}
          iniciales={visible.local.iniciales}
          acento={visible.local.acento}
          logo={visible.local.logoUrl}
        />
        <p className="font-display text-2xl text-primary-orange md:text-4xl">VS</p>
        <Escudo
          nombre={visible.visitante.nombre}
          iniciales={visible.visitante.iniciales}
          acento={visible.visitante.acento}
          logo={visible.visitante.logoUrl}
        />
      </div>
      <div className="relative mt-8 flex flex-col items-center justify-between gap-4 border-t border-primary-blue/15 pt-5 sm:flex-row">
        <p className="text-sm text-text-secondary">{visible.horario}</p>
        <div className="flex items-center gap-4">
          <p className="text-sm text-text-secondary">
            Premio:{' '}
            <span className="font-semibold text-primary-orange">
              {formatearNumero(visible.premioPickCoins)} PickCoins
            </span>
          </p>
          <Button aria-label="Hacer mi pick del día">Hacer mi pick</Button>
        </div>
      </div>
    </Card>
  );
}
