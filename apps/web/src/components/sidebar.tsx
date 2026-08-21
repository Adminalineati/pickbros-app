'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { iconoDe } from '@/lib/icons';
import { navPrincipal } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden h-dvh w-[272px] shrink-0 flex-col border-r border-border bg-surface/90 px-4 py-5 lg:flex"
      aria-label="Navegación principal"
    >
      <Link href="/" className="mb-8 flex items-center gap-3 px-2">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary-orange to-primary-blue font-display text-lg text-white shadow-[0_0_24px_color-mix(in_srgb,var(--primary-orange)_40%,transparent)]">
          PB
        </span>
        <span>
          <span className="block font-display text-xl uppercase tracking-wider text-text-primary">
            PickBros
          </span>
          <span className="text-xs text-text-secondary">Picks y recompensas</span>
        </span>
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
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-elevated hover:text-text-primary',
                activo &&
                  'bg-surface-elevated text-text-primary shadow-[inset_3px_0_0_var(--primary-orange)]',
              )}
              aria-current={activo ? 'page' : undefined}
            >
              <Icono className="h-4 w-4" aria-hidden="true" />
              {item.etiqueta}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-2xl border border-primary-blue/30 bg-gradient-to-br from-surface-elevated to-background p-4">
        <div className="mb-2 flex items-center gap-2 text-primary-blue">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wider">Pickster</p>
        </div>
        <p className="font-display text-lg uppercase text-text-primary">Asesor personal</p>
        <p className="mt-1 text-xs text-text-secondary">
          Te acompaña con contexto del día. Pronto con chat real.
        </p>
      </div>
    </aside>
  );
}
