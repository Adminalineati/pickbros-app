import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function StatsCard({
  etiqueta,
  valor,
  icono: Icono,
  acento = 'orange',
}: {
  etiqueta: string;
  valor: string;
  icono: LucideIcon;
  acento?: 'orange' | 'blue' | 'success';
}) {
  const color =
    acento === 'blue'
      ? 'text-primary-blue'
      : acento === 'success'
        ? 'text-success'
        : 'text-primary-orange';

  return (
    <Card className="flex min-w-[140px] flex-1 items-center gap-3 bg-surface-elevated/80 px-3 py-2.5">
      <span
        className={cn(
          'grid h-9 w-9 place-items-center rounded-full bg-background/80',
          color,
        )}
        aria-hidden="true"
      >
        <Icono className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-text-secondary">{etiqueta}</p>
        <p className="font-display text-lg leading-none text-text-primary">{valor}</p>
      </div>
    </Card>
  );
}
