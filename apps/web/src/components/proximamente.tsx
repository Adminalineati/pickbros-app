import { AppShell } from '@/components/app-shell';
import { SectionHeader } from '@/components/section-header';
import { Card } from '@/components/ui/card';

export function Proximamente({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <AppShell>
      <SectionHeader kicker="PickBros" title={titulo} />
      <Card className="max-w-xl">
        <p className="text-sm text-text-secondary">{descripcion}</p>
        <p className="mt-3 text-sm text-text-secondary">
          Esta pantalla es un marcador de posición para no perder el flujo de navegación.
        </p>
      </Card>
    </AppShell>
  );
}
