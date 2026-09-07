'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import {
  cognitoUserPoolConfigured,
  requestPasswordReset,
  resetPassword,
} from '@/lib/local-auth';

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,72}$/;

export default function RecoverPasswordPage() {
  const recoveryChannel = cognitoUserPoolConfigured() ? 'correo' : 'SMS';
  const [step, setStep] = useState<'request' | 'confirm' | 'done'>('request');
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [destination, setDestination] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await requestPasswordReset(correo);
      setDestination(result.telefonoDestino ?? 'el teléfono registrado');
      setDemoCode(result.codigoDemo ?? '');
      setStep('confirm');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos solicitar el código');
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!passwordPattern.test(password)) {
      setError(
        'Usa 12 caracteres con mayúscula, minúscula, número y símbolo',
      );
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(correo, codigo, password);
      setStep('done');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No pudimos actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <AuthShell
        title="Contraseña actualizada"
        subtitle="Tu nueva contraseña ya está lista."
      >
        <Link
          className="flex h-12 items-center justify-center rounded-xl bg-primary-orange font-semibold text-white"
          href="/login"
        >
          Iniciar sesión
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar contraseña"
      subtitle={
        step === 'request'
          ? `Te enviaremos un código por ${recoveryChannel} a tu cuenta registrada.`
          : `Escribe el código enviado a ${destination}.`
      }
    >
      {step === 'request' ? (
        <form className="space-y-4" onSubmit={requestCode}>
          <label className="block text-sm">
            <span className="mb-1.5 block text-text-secondary">Correo</span>
            <input
              autoComplete="email"
              className="auth-input"
              onChange={(event) => setCorreo(event.target.value)}
              required
              type="email"
              value={correo}
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? 'Enviando…' : `Enviar código por ${recoveryChannel}`}
          </Button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={confirmReset}>
          {demoCode ? (
            <div className="rounded-xl border border-primary-orange/40 bg-primary-orange/10 p-3 text-sm">
              <p className="text-text-secondary">Código visible solo en demo local:</p>
              <strong className="font-display text-2xl tracking-[0.3em] text-primary-orange">
                {demoCode}
              </strong>
            </div>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1.5 block text-text-secondary">
              Código de recuperación
            </span>
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
          <label className="block text-sm">
            <span className="mb-1.5 block text-text-secondary">Nueva contraseña</span>
            <div className="relative">
              <input
                autoComplete="new-password"
                className="auth-input pr-12"
                onChange={(event) => setPassword(event.target.value)}
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
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
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-text-secondary">
              Confirmar contraseña
            </span>
            <input
              autoComplete="new-password"
              className="auth-input"
              onChange={(event) => setConfirmation(event.target.value)}
              required
              type={showPassword ? 'text' : 'password'}
              value={confirmation}
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? 'Actualizando…' : 'Cambiar contraseña'}
          </Button>
        </form>
      )}

      <p className="mt-5 text-center text-sm text-text-secondary">
        <Link className="font-semibold text-primary-orange" href="/login">
          Volver al inicio de sesión
        </Link>
      </p>
    </AuthShell>
  );
}
