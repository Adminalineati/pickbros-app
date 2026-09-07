import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ProBanner() {
  return (
    <section
      aria-label="PickBros Pro"
      className="relative overflow-hidden rounded-2xl border border-primary-orange/50 bg-gradient-to-r from-primary-orange/20 via-surface to-primary-blue/15 p-5 shadow-[0_0_30px_color-mix(in_srgb,var(--primary-orange)_14%,transparent)] md:flex md:items-center md:justify-between md:p-7"
    >
      <div className="pointer-events-none absolute -left-12 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-primary-orange/15 blur-3xl" />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-orange">
          PickBros Pro
        </p>
        <h2 className="mt-1 font-display text-2xl uppercase md:text-4xl">
          Suscríbete a PickBros Pro
        </h2>
        <p className="mt-2 max-w-xl text-sm text-text-secondary">
          Más picks, más análisis, más ganancias. El plan real se conecta más adelante.
        </p>
      </div>
      <Button asChild className="relative mt-4 md:mt-0" variant="default">
        <Link href="/ayuda">Ver planes</Link>
      </Button>
    </section>
  );
}
