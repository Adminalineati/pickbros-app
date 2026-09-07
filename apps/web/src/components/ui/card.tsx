import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-primary-blue/25 bg-gradient-to-br from-surface-elevated/95 via-surface/95 to-background/95 p-4 shadow-[inset_0_1px_0_color-mix(in_srgb,white_8%,transparent),0_16px_38px_color-mix(in_srgb,var(--background)_70%,transparent),0_0_22px_color-mix(in_srgb,var(--primary-blue)_7%,transparent)]',
        className,
      )}
      {...props}
    />
  );
}
