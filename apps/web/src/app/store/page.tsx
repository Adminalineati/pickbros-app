import { AppShell } from '@/components/app-shell';
import { StoreHero } from '@/components/store-hero';
import { obtenerTienda } from '@/lib/data';

export default async function StorePage() {
  const data = await obtenerTienda();

  return (
    <AppShell>
      <StoreHero data={data} />
    </AppShell>
  );
}
