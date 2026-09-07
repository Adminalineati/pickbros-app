'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'flex w-full gap-2 overflow-x-auto rounded-2xl border border-primary-blue/25 bg-background/75 p-1 shadow-inner',
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
        'shrink-0 rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-text-secondary transition-all hover:bg-surface-elevated hover:text-text-primary data-[state=active]:border-primary-orange/50 data-[state=active]:bg-primary-orange data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_color-mix(in_srgb,var(--primary-orange)_32%,transparent)]',
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;
