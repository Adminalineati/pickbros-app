import { Coins, Flame, Ticket, Trophy } from 'lucide-react';
import { StatsCard } from '@/components/stats-card';
import { formatearNumero } from '@/lib/format';

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
  return (
    <header className="flex flex-col gap-4 border-b border-border/80 pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="font-display text-2xl uppercase tracking-wide text-text-primary md:text-3xl">
          {saludo}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          Rango actual: <span className="text-primary-orange">{rango}</span> · Nivel {nivel}
        </p>
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
