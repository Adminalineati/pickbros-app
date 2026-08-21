import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface p-4 shadow-[inset_0_1px_0_color-mix(in_srgb,white_8%,transparent)]',
        className,
      )}
      {...props}
    />
  );
}
