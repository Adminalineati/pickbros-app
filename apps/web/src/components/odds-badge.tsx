import { cn } from '@/lib/utils';
import { formatearAmerican } from '@/lib/odds-format';

export function OddsBadge({
  odds,
  className,
}: {
  odds?: number;
  className?: string;
}) {
  if (odds === undefined) return null;

  return (
    <span
      className={cn(
        'inline-flex min-w-12 justify-center rounded-md border border-primary-blue/25 bg-background px-2 py-0.5 font-display text-sm text-text-primary',
        className,
      )}
    >
      {formatearAmerican(odds)}
    </span>
  );
}
