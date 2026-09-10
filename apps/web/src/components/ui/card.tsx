import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/8 bg-surface-card p-4 shadow-[inset_0_1px_0_color-mix(in_srgb,white_6%,transparent),0_16px_38px_color-mix(in_srgb,var(--background)_70%,transparent)]',
        className,
      )}
      {...props}
    />
  );
}
