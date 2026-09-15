import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell';
import { PickForm } from '@/components/pick-form';

export default function NuevoPickPage() {
  return (
    <AppShell>
      <Suspense fallback={<p className="text-text-secondary">Cargando evento…</p>}>
        <PickForm />
      </Suspense>
    </AppShell>
  );
}
