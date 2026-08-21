'use client';

import { Coins, Flame, Ticket, Trophy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { ProductoTienda, TiendaRespuesta } from '@pickbros/types';
import { ProductCard } from '@/components/product-card';
import { StatsCard } from '@/components/stats-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatearNumero } from '@/lib/format';

const pestanas = [
  { id: 'fan-shop', etiqueta: 'Fan Shop' },
  { id: 'recompensas', etiqueta: 'Recompensas' },
  { id: 'premios-exclusivos', etiqueta: 'Premios exclusivos' },
  { id: 'merch', etiqueta: 'PickBros Merch' },
] as const;

function filtrar(productos: ProductoTienda[], categoria: string, busqueda: string) {
  return productos.filter((producto) => {
    const mismaCategoria = producto.categoria === categoria;
    const texto = `${producto.nombre} ${producto.descripcion}`.toLowerCase();
    return mismaCategoria && texto.includes(busqueda.toLowerCase());
  });
}

export function StoreHero({ data }: { data: TiendaRespuesta }) {
  const { register, watch } = useForm({ defaultValues: { busqueda: '' } });
  const busqueda = watch('busqueda');

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-blue">
          Canje
        </p>
        <h1 className="font-display text-4xl uppercase tracking-wide md:text-6xl">PickStore</h1>
        <p className="max-w-2xl text-sm text-text-secondary">
          Gasta Pickets y PickCoins en merch, boosts y premios. Esta primera versión es visual:
          todavía no hay compras reales.
        </p>
        <div className="flex gap-2 overflow-x-auto" aria-label="Saldo disponible">
          <StatsCard
            etiqueta="Pickets disponibles"
            valor={formatearNumero(data.pickets)}
            icono={Ticket}
            acento="blue"
          />
          <StatsCard
            etiqueta="PickCoins"
            valor={formatearNumero(data.pickCoins)}
            icono={Coins}
            acento="orange"
          />
          <StatsCard etiqueta="Nivel" valor={String(data.rango.nivel)} icono={Trophy} acento="blue" />
          <StatsCard
            etiqueta="Racha"
            valor={`${data.rachaDias} días`}
            icono={Flame}
            acento="success"
          />
        </div>
      </header>

      <Card className="relative overflow-hidden border-primary-orange/30 bg-gradient-to-br from-[#2a150a] to-surface p-5 md:flex md:items-center md:justify-between md:p-8">
        <div className="max-w-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-orange">
            {data.productoDestacado.etiqueta}
          </p>
          <h2 className="mt-2 font-display text-3xl uppercase md:text-5xl">
            {data.productoDestacado.nombre}
          </h2>
          <p className="mt-3 text-sm text-text-secondary">{data.productoDestacado.descripcion}</p>
          <p className="mt-4 font-semibold text-primary-orange">
            {data.productoDestacado.precioPickets
              ? `${data.productoDestacado.precioPickets} Pickets`
              : `${formatearNumero(data.productoDestacado.precioPickCoins ?? 0)} PickCoins`}
          </p>
        </div>
        <div
          className="mt-6 grid h-36 w-full place-items-center rounded-3xl bg-gradient-to-br from-primary-orange/40 to-primary-blue/30 font-display text-5xl md:mt-0 md:h-44 md:w-56"
          aria-hidden="true"
        >
          PB
        </div>
      </Card>

      <form className="max-w-md" onSubmit={(evento) => evento.preventDefault()}>
        <label htmlFor="busqueda-tienda" className="sr-only">
          Buscar en la PickStore
        </label>
        <input
          id="busqueda-tienda"
          placeholder="Buscar producto..."
          className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-text-primary placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue"
          {...register('busqueda')}
        />
      </form>

      <Tabs defaultValue="fan-shop">
        <TabsList aria-label="Categorías de la PickStore">
          {pestanas.map((pestana) => (
            <TabsTrigger key={pestana.id} value={pestana.id}>
              {pestana.etiqueta}
            </TabsTrigger>
          ))}
        </TabsList>
        {pestanas.map((pestana) => {
          const items = filtrar(data.productos, pestana.id, busqueda);
          return (
            <TabsContent key={pestana.id} value={pestana.id} className="mt-4">
              {items.length === 0 ? (
                <p className="text-sm text-text-secondary">No hay productos en esta vista.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((producto) => (
                    <ProductCard key={producto.id} producto={producto} />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="flex justify-center">
        <Button variant="outline" disabled>
          Canje no disponible todavía
        </Button>
      </div>
    </div>
  );
}
