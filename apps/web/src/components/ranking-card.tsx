import type { PosicionRanking } from '@pickbros/types';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/section-header';
import { cn } from '@/lib/utils';

export function RankingCard({ ranking }: { ranking: PosicionRanking[] }) {
  return (
    <section aria-labelledby="ranking-semanal">
      <SectionHeader id="ranking-semanal" kicker="Competencia" title="Top PickBros de la semana" />
      <Card className="space-y-2">
        {ranking.map((fila) => (
          <div
            key={fila.alias}
            className={cn(
              'flex items-center justify-between rounded-xl px-3 py-2.5',
              fila.esUsuarioActual && 'border border-primary-orange/40 bg-primary-orange/10',
            )}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-background font-display text-sm text-primary-blue">
                {fila.puesto}
              </span>
              <div>
                <p className="font-semibold">{fila.alias}</p>
                {fila.esUsuarioActual ? (
                  <p className="text-xs text-primary-orange">Eres tú</p>
                ) : null}
              </div>
            </div>
            <p className="text-sm text-text-secondary">{fila.puntos} pts</p>
          </div>
        ))}
      </Card>
    </section>
  );
}
