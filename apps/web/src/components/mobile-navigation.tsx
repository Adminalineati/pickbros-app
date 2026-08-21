'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { iconoDe } from '@/lib/icons';
import { navMovil } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md lg:hidden"
      aria-label="Navegación inferior"
    >
      <ul className="grid grid-cols-5 items-end">
        {navMovil.map((item) => {
          const Icono = iconoDe(item.icono);
          const esNuevo = item.href === '/picks/nuevo';
          const activo =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li key={item.href} className="flex justify-center">
              <Link
                href={item.href}
                aria-current={activo ? 'page' : undefined}
                aria-label={item.etiqueta}
                className={cn(
                  'flex min-w-[56px] flex-col items-center gap-1 px-1 text-[11px] font-medium text-text-secondary',
                  activo && !esNuevo && 'text-primary-orange',
                  esNuevo && '-mt-5',
                )}
              >
                <span
                  className={cn(
                    'grid place-items-center rounded-2xl',
                    esNuevo
                      ? 'h-14 w-14 bg-primary-orange text-white shadow-[0_8px_24px_color-mix(in_srgb,var(--primary-orange)_45%,transparent)]'
                      : 'h-8 w-8',
                  )}
                >
                  <Icono className={esNuevo ? 'h-6 w-6' : 'h-5 w-5'} aria-hidden="true" />
                </span>
                <span className={esNuevo ? 'text-primary-orange' : undefined}>{item.etiqueta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
