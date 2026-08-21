'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'flex w-full gap-2 overflow-x-auto rounded-2xl border border-border bg-surface p-1',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary data-[state=active]:bg-surface-elevated data-[state=active]:text-text-primary data-[state=active]:shadow-[0_0_16px_color-mix(in_srgb,var(--primary-blue)_20%,transparent)]',
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
