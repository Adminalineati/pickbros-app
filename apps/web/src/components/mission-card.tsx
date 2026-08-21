import type { MisionDiaria } from '@pickbros/types';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { SectionHeader } from '@/components/section-header';

export function MissionCard({ misiones }: { misiones: MisionDiaria[] }) {
  return (
    <section aria-labelledby="mision-diaria">
      <SectionHeader id="mision-diaria" kicker="Hábitos" title="Misión diaria" />
      <div className="grid gap-3">
        {misiones.map((mision) => {
          const porcentaje = Math.round((mision.progreso / mision.meta) * 100);
          return (
            <Card key={mision.id} className="bg-surface-elevated/70">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="font-semibold">{mision.titulo}</p>
                <p className="text-xs text-text-secondary">
                  {mision.progreso}/{mision.meta}
                </p>
              </div>
              <p className="mb-3 text-sm text-text-secondary">{mision.descripcion}</p>
              <Progress value={porcentaje} label={`Progreso de ${mision.titulo}: ${porcentaje}%`} />
            </Card>
          );
        })}
      </div>
    </section>
  );
}
