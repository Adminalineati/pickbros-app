'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { resendVerification, verifyEmail } from '@/lib/local-auth';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoDemo, setCodigoDemo] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pending = sessionStorage.getItem('pickbros-pending-verification');
    if (!pending) return;

    try {
      const value = JSON.parse(pending) as {
        correo?: string;
        codigoDemo?: string;
      };
      setCorreo(value.correo ?? '');
      setCodigoDemo(value.codigoDemo ?? '');
    } catch {
      sessionStorage.removeItem('pickbros-pending-verification');
    }
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyEmail(correo, codigo);
      sessionStorage.removeItem('pickbros-pending-verification');
      sessionStorage.setItem('pickbros-registration-complete', 'true');
      router.push('/login');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos verificar el correo');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError('');
    setMessage('');
    try {
      const result = await resendVerification(correo);
      setMessage(result.mensaje);
      setCodigoDemo(result.codigoDemo ?? '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos reenviar el código');
    }
  }

  return (
    <AuthShell
      title="Verifica tu correo"
      subtitle="Ingresa el código de seis dígitos que enviamos a tu correo."
      wide
    >
      {codigoDemo ? (
        <div className="mb-4 rounded-xl border border-primary-orange/40 bg-primary-orange/10 p-3 text-sm">
          <p className="text-text-secondary">Código visible solamente en el demo local:</p>
          <strong className="font-display text-2xl tracking-[0.3em] text-primary-orange">
            {codigoDemo}
          </strong>
        </div>
      ) : null}

      <form className="space-y-4" onSubmit={submit}>
        <label className="block text-sm">
          <span className="mb-1.5 block text-text-secondary">Correo</span>
          <input
            className="auth-input"
            onChange={(event) => setCorreo(event.target.value)}
            required
            type="email"
            value={correo}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-text-secondary">Código</span>
          <input
            autoComplete="one-time-code"
            className="auth-input text-center font-display text-xl tracking-[0.3em]"
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setCodigo(event.target.value.replace(/\D/g, ''))}
            pattern="\d{6}"
            required
            value={codigo}
          />
        </label>

        {message ? <p className="text-sm text-success">{message}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button className="w-full" disabled={loading} type="submit">
          {loading ? 'Verificando…' : 'Activar cuenta'}
        </Button>
      </form>

      <button
        className="mt-4 w-full text-sm font-semibold text-primary-orange"
        disabled={!correo}
        onClick={() => void resend()}
        type="button"
      >
        Reenviar código
      </button>
      <p className="mt-5 text-center text-sm text-text-secondary">
        <Link className="font-semibold text-primary-orange" href="/login">
          Volver al inicio de sesión
        </Link>
      </p>
    </AuthShell>
  );
}
