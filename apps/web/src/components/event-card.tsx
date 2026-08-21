import type { EventoDestacado } from '@pickbros/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ligaColor: Record<EventoDestacado['liga'], string> = {
  MLB: 'border-primary-blue/40 text-primary-blue',
  NBA: 'border-primary-orange/40 text-primary-orange',
  NFL: 'border-success/40 text-success',
  Champions: 'border-text-secondary/40 text-text-secondary',
};

export function EventCard({ evento }: { evento: EventoDestacado }) {
  return (
    <Card className="flex h-full flex-col gap-4 bg-surface-elevated/70">
      <Badge className={ligaColor[evento.liga]}>{evento.liga}</Badge>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-background font-display text-xs">
            {evento.inicialesLocal}
          </span>
          <span className="text-sm font-semibold">{evento.local}</span>
        </div>
        <span className="text-xs text-text-secondary">vs</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{evento.visitante}</span>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-background font-display text-xs">
            {evento.inicialesVisitante}
          </span>
        </div>
      </div>
      <p className="text-sm text-text-secondary">{evento.horario}</p>
      <Button variant="outline" size="sm" className="mt-auto w-full" aria-label={`Ver picks de ${evento.local} contra ${evento.visitante}`}>
        Ver picks
      </Button>
    </Card>
  );
}
