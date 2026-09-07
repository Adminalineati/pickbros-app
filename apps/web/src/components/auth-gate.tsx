'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { authConfigured } from '@/lib/auth';
import {
  cognitoUserPoolConfigured,
  refreshSession,
} from '@/lib/local-auth';

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const required = process.env.NEXT_PUBLIC_LOCAL_AUTH_REQUIRED === 'true';
  const hostedAuthConfigured =
    authConfigured() && !cognitoUserPoolConfigured();
  const [ready, setReady] = useState(!required || hostedAuthConfigured);

  useEffect(() => {
    if (!required || hostedAuthConfigured) {
      setReady(true);
      return;
    }

    void refreshSession().then((user) => {
      if (user) {
        setReady(true);
      } else {
        router.replace('/login');
      }
    });
  }, [hostedAuthConfigured, required, router]);

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background text-text-secondary">
        Validando sesión…
      </div>
    );
  }

  return children;
}
