import Image from 'next/image';
import { cn } from '@/lib/utils';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const iconSrc = `${basePath}/assets/brand/logo-icon.jpg`;
const wordmarkSrc = `${basePath}/assets/brand/logo-wordmark.jpg`;

export function BrandMark({
  variant = 'lockup',
  className,
}: {
  variant?: 'icon' | 'lockup' | 'wordmark';
  className?: string;
}) {
  if (variant === 'wordmark') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-2xl bg-white px-3 py-2',
          className,
        )}
      >
        <Image
          alt="PickBros"
          className="h-10 w-auto md:h-12"
          height={48}
          src={wordmarkSrc}
          width={220}
        />
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <Image
        alt={variant === 'icon' ? 'PickBros' : ''}
        className="h-11 w-11 rounded-xl object-cover shadow-[0_0_24px_color-mix(in_srgb,var(--primary-orange)_28%,transparent)]"
        height={44}
        src={iconSrc}
        width={44}
      />
      {variant === 'lockup' ? (
        <span>
          <span className="block font-display text-xl uppercase tracking-wider text-primary-orange">
            PickBros
          </span>
          <span className="text-[10px] uppercase tracking-[0.16em] text-text-secondary">
            Picks · análisis · comunidad
          </span>
        </span>
      ) : null}
    </span>
  );
}
