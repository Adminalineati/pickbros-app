import Image from 'next/image';
import { cn } from '@/lib/utils';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const wordmarkDarkSrc = `${basePath}/assets/brand/logo-wordmark-dark.png`;

export function BrandMark({
  variant = 'lockup',
  className,
}: {
  variant?: 'icon' | 'lockup' | 'wordmark';
  className?: string;
}) {
  if (variant === 'wordmark' || variant === 'lockup') {
    return (
      <Image
        alt="PickBros"
        className={cn('h-10 w-auto md:h-12', className)}
        height={48}
        priority={variant === 'wordmark'}
        src={wordmarkDarkSrc}
        width={280}
      />
    );
  }

  return (
    <Image
      alt="PickBros"
      className={cn(
        'h-11 w-11 rounded-xl object-cover shadow-[0_0_24px_color-mix(in_srgb,var(--primary-orange)_28%,transparent)]',
        className,
      )}
      height={44}
      src={wordmarkDarkSrc}
      width={44}
    />
  );
}
