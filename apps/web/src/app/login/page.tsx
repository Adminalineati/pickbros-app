'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { authConfigured, authManager } from '@/lib/auth';
import {
  ApiError,
  cognitoUserPoolConfigured,
  login,
} from '@/lib/local-auth';

const schema = z.object({
  correo: z.string().email('Escribe un correo válido'),
  password: z.string().min(1, 'Escribe tu contraseña'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>();

  useEffect(() => {
    if (authConfigured() && !cognitoUserPoolConfigured()) {
      void authManager().signinRedirect();
      return;
    }

    const completed = sessionStorage.getItem('pickbros-registration-complete');
    if (completed) {
      setRegistered(true);
      sessionStorage.removeItem('pickbros-registration-complete');
    }
  }, []);

  const submit = handleSubmit(async (values) => {
    setError('');
    setVerificationRequired(false);
    const result = schema.safeParse(values);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Revisa los datos');
      return;
    }

    try {
      await login(result.data.correo, result.data.password);
      router.push('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos iniciar sesión');
      if (
        cause instanceof ApiError &&
        ['EMAIL_NOT_VERIFIED', 'UserNotConfirmedException'].includes(
          String(cause.details.code),
        )
      ) {
        setVerificationRequired(true);
        sessionStorage.setItem(
          'pickbros-pending-verification',
          JSON.stringify({ correo: result.data.correo }),
        );
      }
    }
  });

  return (
    <AuthShell title="Iniciar sesión" subtitle="Entra con el correo y contraseña de tu cuenta.">
      {registered ? (
        <p className="mb-4 rounded-xl border border-success/40 bg-success/10 p-3 text-sm text-success">
          Tu cuenta quedó lista. Ya puedes iniciar sesión.
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={submit}>
        <label className="block text-sm">
          <span className="mb-1.5 block text-text-secondary">Correo</span>
          <input
            autoComplete="email"
            className="auth-input"
            type="email"
            {...register('correo')}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-text-secondary">Contraseña</span>
          <div className="relative">
            <input
              autoComplete="current-password"
              className="auth-input pr-12"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
            />
            <button
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute inset-y-0 right-0 grid w-12 place-items-center text-text-secondary hover:text-primary-orange"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" size={18} />
              ) : (
                <Eye aria-hidden="true" size={18} />
              )}
            </button>
          </div>
          <Link
            className="mt-2 block text-right text-xs font-semibold text-primary-orange"
            href="/recuperar-password"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </label>

        {error ? (
          <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            <p>{error}</p>
            {verificationRequired ? (
              <Link
                className="mt-2 inline-block font-semibold underline"
                href="/verificar-correo"
              >
                Verificar mi correo
              </Link>
            ) : null}
          </div>
        ) : null}

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-secondary">
        ¿Todavía no tienes cuenta?{' '}
        <Link className="font-semibold text-primary-blue" href="/registro">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}
