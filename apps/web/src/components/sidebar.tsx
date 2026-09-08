'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { iconoDe } from '@/lib/icons';
import { navPrincipal } from '@/lib/nav';
import { cn } from '@/lib/utils';

const picksterImage = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/assets/pickster/pickster-panel-oscuro.png`;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="sticky top-0 hidden h-dvh w-[272px] shrink-0 flex-col overflow-y-auto border-r border-primary-blue/15 bg-background/95 px-4 py-5 shadow-[12px_0_40px_color-mix(in_srgb,var(--background)_72%,transparent)] backdrop-blur-xl lg:flex"
      aria-label="Navegación principal"
    >
      <Link href="/" className="mb-8 px-2">
        <BrandMark />
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {navPrincipal.map((item) => {
          const Icono = iconoDe(item.icono);
          const activo =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-text-secondary transition-all hover:border-primary-blue/15 hover:bg-surface-elevated/70 hover:text-text-primary',
                activo &&
                  'border-primary-orange/35 bg-gradient-to-r from-primary-orange to-primary-orange/75 text-white shadow-[0_8px_24px_color-mix(in_srgb,var(--primary-orange)_25%,transparent)]',
              )}
              aria-current={activo ? 'page' : undefined}
            >
              <Icono className="h-4 w-4" aria-hidden="true" />
              {item.etiqueta}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-4 min-h-[290px] overflow-hidden rounded-2xl border border-primary-blue/25 bg-background shadow-[0_0_28px_color-mix(in_srgb,var(--primary-blue)_10%,transparent)]">
        <Image
          src={picksterImage}
          alt=""
          fill
          sizes="240px"
          className="object-cover object-[center_18%] opacity-90"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/10 to-background/95" />
        <div className="relative z-10 p-4">
          <div className="mb-1 flex items-center gap-2 text-primary-blue">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Pickster</p>
          </div>
          <p className="font-display text-xl uppercase text-text-primary">Tu asesor personal</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 z-10 p-4">
          <div className="flex items-center gap-2 text-primary-orange">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-wider">
              Pregúntale a Pickster
            </p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            Contexto del día y apoyo para tus picks.
          </p>
        </div>
      </div>
    </aside>
  );
}
