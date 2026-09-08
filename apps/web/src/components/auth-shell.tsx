import Link from 'next/link';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/brand-mark';

export function AuthShell({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="pb-app-bg relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <section
        className={`${wide ? 'max-w-2xl' : 'max-w-md'} relative z-10 w-full overflow-hidden rounded-3xl border border-primary-orange/35 bg-gradient-to-br from-surface-elevated via-surface to-background p-6 shadow-[0_0_42px_color-mix(in_srgb,var(--primary-orange)_16%,transparent),0_0_42px_color-mix(in_srgb,var(--primary-blue)_9%,transparent)] md:p-8`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-orange via-primary-orange to-primary-blue" />
        <Link href="/" className="mb-8 flex justify-center">
          <BrandMark variant="wordmark" />
        </Link>
        <h1 className="font-display text-3xl uppercase tracking-wide">{title}</h1>
        <p className="mt-2 text-sm text-text-secondary">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
