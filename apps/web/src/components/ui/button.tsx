import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase tracking-wide transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px',
  {
    variants: {
      variant: {
        default:
          'border border-primary-orange bg-primary-orange text-white shadow-[0_0_24px_color-mix(in_srgb,var(--primary-orange)_32%,transparent)] hover:brightness-110',
        blue:
          'border border-primary-blue bg-primary-blue text-background shadow-[0_0_22px_color-mix(in_srgb,var(--primary-blue)_24%,transparent)] hover:brightness-110',
        ghost:
          'bg-transparent text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
        outline:
          'border border-primary-blue/30 bg-background/40 text-text-primary hover:border-primary-blue/70 hover:bg-primary-blue/10',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = 'button',
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
