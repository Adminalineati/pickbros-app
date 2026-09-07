'use client';

import { Coins, Flame, Ticket, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AuthButton } from '@/components/auth-button';
import { StatsCard } from '@/components/stats-card';
import { formatearNumero } from '@/lib/format';
import { currentUser, sessionEventName, type SessionUser } from '@/lib/local-auth';

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
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const sync = () => setSessionUser(currentUser());
    sync();
    window.addEventListener(sessionEventName(), sync);
    return () => window.removeEventListener(sessionEventName(), sync);
  }, []);

  const displayGreeting = sessionUser
    ? `¿Qué onda, ${sessionUser.nombre}! 👋`
    : saludo;

  return (
    <header className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-primary-blue/20 bg-gradient-to-r from-surface via-background/85 to-surface p-4 shadow-[0_0_30px_color-mix(in_srgb,var(--primary-blue)_7%,transparent)] lg:flex-row lg:items-center lg:justify-between">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary-orange via-primary-orange/70 to-primary-blue" />
      <div className="flex items-center gap-4">
        <div>
          <p className="font-display text-2xl uppercase tracking-wide text-text-primary md:text-3xl">
            {displayGreeting}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Rango actual: <span className="text-primary-orange">{rango}</span> · Nivel {nivel}
          </p>
        </div>
        <AuthButton />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Estadísticas del perfil">
        <StatsCard
          etiqueta="PickCoins"
          valor={formatearNumero(pickCoins)}
          icono={Coins}
          acento="orange"
        />
        <StatsCard etiqueta="Pickets" valor={formatearNumero(pickets)} icono={Ticket} acento="blue" />
        <StatsCard
          etiqueta="Racha actual"
          valor={`${rachaDias} días`}
          icono={Flame}
          acento="success"
        />
        <div className="hidden md:block">
          <StatsCard etiqueta="Nivel" valor={String(nivel)} icono={Trophy} acento="blue" />
        </div>
      </div>
    </header>
  );
}
