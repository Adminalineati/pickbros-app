import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function SectionHeader({
  kicker,
  title,
  action,
  className,
  id,
}: {
  kicker?: string;
  title: string;
  action?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      className={cn(
        'mb-4 flex items-end justify-between gap-3 border-b border-primary-blue/15 pb-2',
        className,
      )}
    >
      <div>
        {kicker ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-blue">
            {kicker}
          </p>
        ) : null}
        <h2
          id={id}
          className="font-display text-xl uppercase tracking-wide text-text-primary md:text-2xl"
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
