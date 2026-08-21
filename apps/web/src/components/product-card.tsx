import type { ProductoTienda } from '@pickbros/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatearNumero } from '@/lib/format';

export function ProductCard({ producto }: { producto: ProductoTienda }) {
  const precio = producto.precioPickets
    ? `${producto.precioPickets} Pickets`
    : `${formatearNumero(producto.precioPickCoins ?? 0)} PickCoins`;

  return (
    <Card className="flex h-full flex-col gap-3 bg-surface-elevated/70">
      <div
        className="grid h-28 place-items-center rounded-xl bg-gradient-to-br from-background to-primary-blue/20 font-display text-2xl text-primary-blue"
        aria-hidden="true"
      >
        {producto.nombre.slice(0, 2).toUpperCase()}
      </div>
      {producto.etiqueta ? <Badge>{producto.etiqueta}</Badge> : null}
      <h3 className="font-display text-xl uppercase tracking-wide">{producto.nombre}</h3>
      <p className="text-sm text-text-secondary">{producto.descripcion}</p>
      <p className="mt-auto font-semibold text-primary-orange">{precio}</p>
      <Button variant="outline" disabled aria-label={`Canjear ${producto.nombre} (próximamente)`}>
        Canjear
      </Button>
    </Card>
  );
}
