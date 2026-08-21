import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ProBanner() {
  return (
    <section
      aria-label="PickBros Pro"
      className="overflow-hidden rounded-2xl border border-primary-orange/30 bg-gradient-to-r from-[#2a1408] via-surface to-[#0b1c33] p-5 md:flex md:items-center md:justify-between md:p-7"
    >
      <div>
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
      <Button asChild className="mt-4 md:mt-0" variant="default">
        <Link href="/ayuda">Ver planes</Link>
      </Button>
    </section>
  );
}
