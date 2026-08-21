import { AppShell } from '@/components/app-shell';
import { Dashboard } from '@/components/dashboard';
import { obtenerDashboard } from '@/lib/data';

export default async function HomePage() {
  const data = await obtenerDashboard();

  return (
    <AppShell>
      <Dashboard data={data} />
    </AppShell>
  );
}
