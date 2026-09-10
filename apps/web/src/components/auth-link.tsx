import type { AnchorHTMLAttributes } from 'react';
import { authHref } from '@/lib/auth-routes';
import { cn } from '@/lib/utils';

export function AuthLink({
  href,
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <a className={cn(className)} href={authHref(href)} {...props}>
      {children}
    </a>
  );
}
