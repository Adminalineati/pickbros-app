'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

export function Progress({
  value,
  className,
  label,
}: {
  value: number;
  className?: string;
  label: string;
}) {
  return (
    <ProgressPrimitive.Root
      aria-label={label}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-background',
        className,
      )}
      value={value}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-gradient-to-r from-primary-orange to-primary-blue transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </ProgressPrimitive.Root>
  );
}
