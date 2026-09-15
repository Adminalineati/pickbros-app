'use client';

import { Coins, Flame, Ticket, Trophy } from 'lucide-react';
import { AuthButton } from '@/components/auth-button';
import { StatsCard } from '@/components/stats-card';
import { formatearNumero } from '@/lib/format';
import { useSessionProfile } from '@/lib/use-session-profile';

export function Header({
  saludo,
  rango,
  nivel,
  pickCoins,
  pickets,
  rachaDias,
}: {
  saludo: string;
  rango: string;
  nivel: number;
  pickCoins: number;
  pickets: number;
  rachaDias: number;
}) {
  const stats = useSessionProfile({
    pickCoins,
    pickets,
    rachaDias,
    nivel,
    rango,
    saludo,
  });

  return (
    <header className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/8 bg-surface-card p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary-orange/70" />
      <div className="flex items-center gap-4">
        <div>
          <p className="font-display text-2xl uppercase tracking-wide text-text-primary md:text-3xl">
            {stats.saludo}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Rango actual: <span className="text-primary-orange">{stats.rango}</span> · Nivel {stats.nivel}
          </p>
        </div>
        <AuthButton />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Estadísticas del perfil">
        <StatsCard
          etiqueta="PickCoins"
          valor={formatearNumero(stats.pickCoins)}
          icono={Coins}
          acento="orange"
        />
        <StatsCard etiqueta="Pickets" valor={formatearNumero(stats.pickets)} icono={Ticket} acento="blue" />
        <StatsCard
          etiqueta="Racha actual"
          valor={`${stats.rachaDias} días`}
          icono={Flame}
          acento="success"
        />
        <div className="hidden md:block">
          <StatsCard etiqueta="Nivel" valor={String(stats.nivel)} icono={Trophy} acento="blue" />
        </div>
      </div>
    </header>
  );
}
