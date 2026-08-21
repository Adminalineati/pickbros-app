'use client';

import type { ChallengeDelDia } from '@pickbros/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatearNumero } from '@/lib/format';

function Escudo({ iniciales, acento, nombre }: { iniciales: string; acento: string; nombre: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="grid h-20 w-20 place-items-center rounded-full border-2 font-display text-2xl text-white shadow-[0_0_24px_color-mix(in_srgb,var(--primary-blue)_25%,transparent)] md:h-24 md:w-24 md:text-3xl"
        style={{ borderColor: acento, background: `${acento}22` }}
        aria-hidden="true"
      >
        {iniciales}
      </span>
      <p className="font-display text-lg uppercase tracking-wide md:text-xl">{nombre}</p>
    </div>
  );
}

export function DailyChallenge({ challenge }: { challenge: ChallengeDelDia }) {
  return (
    <Card className="relative overflow-hidden border-primary-blue/30 bg-gradient-to-br from-surface-elevated via-surface to-background p-5 shadow-[0_0_40px_color-mix(in_srgb,var(--primary-blue)_12%,transparent)] md:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-orange/10 blur-3xl" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-orange">
        {challenge.titulo}
      </p>
      <h2 className="mt-2 font-display text-3xl uppercase tracking-wide md:text-5xl">
        {challenge.pregunta}
      </h2>
      <div className="mt-8 flex items-center justify-center gap-4 md:gap-10">
        <Escudo
          nombre={challenge.local.nombre}
          iniciales={challenge.local.iniciales}
          acento={challenge.local.acento}
        />
        <p className="font-display text-2xl text-primary-orange md:text-4xl">VS</p>
        <Escudo
          nombre={challenge.visitante.nombre}
          iniciales={challenge.visitante.iniciales}
          acento={challenge.visitante.acento}
        />
      </div>
      <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-text-secondary">{challenge.horario}</p>
        <div className="flex items-center gap-4">
          <p className="text-sm text-text-secondary">
            Premio:{' '}
            <span className="font-semibold text-primary-orange">
              {formatearNumero(challenge.premioPickCoins)} PickCoins
            </span>
          </p>
          <Button aria-label="Hacer mi pick del día">Hacer mi pick</Button>
        </div>
      </div>
    </Card>
  );
}
