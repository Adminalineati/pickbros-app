'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { authManager } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    void authManager()
      .signinRedirectCallback()
      .then(() => router.replace('/'))
      .catch(() => setError('No pudimos completar el inicio de sesión. Inténtalo nuevamente.'));
  }, [router]);

  return (
    <AuthShell
      title="Ingresando a PickBros"
      subtitle={error || 'Estamos validando tu cuenta de forma segura…'}
    >
      <div className="h-1.5 overflow-hidden rounded-full bg-background">
        <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-primary-orange to-primary-blue" />
      </div>
    </AuthShell>
  );
}
