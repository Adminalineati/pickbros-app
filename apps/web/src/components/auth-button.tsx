'use client';

import { Eye, LogIn, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { User } from 'oidc-client-ts';
import { authConfigured, authManager } from '@/lib/auth';
import {
  cognitoUserPoolConfigured,
  currentUser,
  logout,
  sessionEventName,
  type SessionUser,
} from '@/lib/local-auth';

export function AuthButton() {
  const [user, setUser] = useState<User | null>();
  const [localUser, setLocalUser] = useState<SessionUser | null>(null);
  const configured = authConfigured() && !cognitoUserPoolConfigured();
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  useEffect(() => {
    if (demoMode) {
      setUser(null);
      setLocalUser(null);
      return;
    }

    if (!configured) {
      setUser(null);
      const sync = () => setLocalUser(currentUser());
      sync();
      window.addEventListener(sessionEventName(), sync);
      window.addEventListener('storage', sync);
      return () => {
        window.removeEventListener(sessionEventName(), sync);
        window.removeEventListener('storage', sync);
      };
    }

    void authManager()
      .getUser()
      .then((currentUser) => setUser(currentUser && !currentUser.expired ? currentUser : null));
  }, [configured, demoMode]);

  const className =
    'inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary-blue/30 bg-background/70 px-3 text-sm text-text-primary transition hover:border-primary-orange hover:bg-primary-orange/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-orange';

  if (demoMode) {
    return (
      <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-primary-orange/40 bg-primary-orange/10 px-3 text-sm font-semibold text-primary-orange">
        <Eye aria-hidden="true" size={16} />
        Vista demo
      </span>
    );
  }

  if (!configured) {
    if (!localUser) {
      return (
        <div className="flex items-center gap-2">
          <Link className={className} href="/login">
            <LogIn aria-hidden="true" size={16} />
            Entrar
          </Link>
          <Link
            className="hidden min-h-10 items-center rounded-lg bg-primary-orange px-3 text-sm font-semibold text-white sm:inline-flex"
            href="/registro"
          >
            Crear cuenta
          </Link>
        </div>
      );
    }

    const planClass =
      localUser.suscripcion === 'subs2'
        ? 'border-primary-blue/50 bg-primary-blue/15 text-primary-blue'
        : 'border-primary-orange/50 bg-primary-orange/15 text-primary-orange';

    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${planClass}`}>
          {localUser.suscripcion}
        </span>
        <span className="hidden text-sm text-text-secondary sm:inline">
          {localUser.nombre}
        </span>
        <button
          className={className}
          onClick={async () => {
            await logout();
            window.location.href = '/login';
          }}
          type="button"
        >
          <LogOut aria-hidden="true" size={16} />
          Salir
        </button>
      </div>
    );
  }

  if (user) {
    return (
      <button className={className} onClick={() => void authManager().signoutRedirect()} type="button">
        <LogOut aria-hidden="true" size={16} />
        Salir
      </button>
    );
  }

  return (
    <button className={className} onClick={() => void authManager().signinRedirect()} type="button">
      <LogIn aria-hidden="true" size={16} />
      Entrar
    </button>
  );
}
