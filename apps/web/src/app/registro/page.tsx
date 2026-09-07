'use client';

import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { authConfigured, authManager } from '@/lib/auth';
import {
  ApiError,
  cognitoUserPoolConfigured,
  register as registerUser,
} from '@/lib/local-auth';

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,72}$/;

function isAdult(value: string) {
  const birthDate = new Date(`${value}T00:00:00`);
  const today = new Date();
  const limit = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );
  return !Number.isNaN(birthDate.getTime()) && birthDate <= limit;
}

const schema = z
  .object({
    nombre: z.string().trim().min(2, 'Escribe tu nombre'),
    apellido: z.string().trim().min(2, 'Escribe tu apellido'),
    correo: z.string().email('Escribe un correo válido'),
    fechaNacimiento: z
      .string()
      .min(1, 'Selecciona tu fecha de nacimiento')
      .refine(isAdult, 'Debes ser mayor de edad'),
    telefono: z
      .string()
      .regex(
        /^\+[1-9]\d{7,14}$/,
        'Incluye código de país, por ejemplo +525512345678',
      ),
    pais: z.string().length(2, 'Selecciona tu país'),
    estado: z.string().trim().min(2, 'Escribe tu estado o provincia'),
    password: z
      .string()
      .regex(
        passwordPattern,
        'Usa 12 caracteres con mayúscula, minúscula, número y símbolo',
      ),
    confirmacion: z.string(),
    suscripcion: z.enum(['SUBS1', 'SUBS2']),
  })
  .refine((data) => data.password === data.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState('');
  const [activationRequired, setActivationRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: { pais: 'MX', suscripcion: 'SUBS1' },
  });

  useEffect(() => {
    if (authConfigured() && !cognitoUserPoolConfigured()) {
      void authManager().signinRedirect();
    }
  }, []);

  const submit = handleSubmit(async (values) => {
    setApiError('');
    setActivationRequired(false);
    const result = schema.safeParse(values);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormData;
        setError(field, { message: issue.message });
      }
      return;
    }

    try {
      const response = await registerUser({
        nombre: result.data.nombre,
        apellido: result.data.apellido,
        correo: result.data.correo,
        password: result.data.password,
        fechaNacimiento: result.data.fechaNacimiento,
        telefono: result.data.telefono,
        pais: result.data.pais,
        estado: result.data.estado,
        suscripcion: result.data.suscripcion,
      });
      sessionStorage.setItem(
        'pickbros-pending-verification',
        JSON.stringify({
          correo: result.data.correo,
          codigoDemo: response.codigoDemo,
        }),
      );
      router.push('/verificar-correo');
    } catch (cause) {
      setApiError(
        cause instanceof Error ? cause.message : 'No pudimos crear la cuenta',
      );
      if (
        cause instanceof ApiError &&
        cause.details.activationRequired === true
      ) {
        setActivationRequired(true);
        sessionStorage.setItem(
          'pickbros-pending-verification',
          JSON.stringify({ correo: result.data.correo }),
        );
      }
    }
  });

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle="Completa tus datos, elige un plan y verifica tu correo."
      wide
    >
      <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <Field label="Nombre" error={errors.nombre?.message}>
          <input
            autoComplete="given-name"
            className="auth-input"
            {...register('nombre')}
          />
        </Field>
        <Field label="Apellido" error={errors.apellido?.message}>
          <input
            autoComplete="family-name"
            className="auth-input"
            {...register('apellido')}
          />
        </Field>
        <Field
          className="md:col-span-2"
          label="Correo"
          error={errors.correo?.message}
        >
          <input
            autoComplete="email"
            className="auth-input"
            type="email"
            {...register('correo')}
          />
        </Field>
        <Field
          label="Fecha de nacimiento"
          error={errors.fechaNacimiento?.message}
        >
          <input
            autoComplete="bday"
            className="auth-input"
            type="date"
            {...register('fechaNacimiento')}
          />
        </Field>
        <Field label="Teléfono celular" error={errors.telefono?.message}>
          <input
            autoComplete="tel"
            className="auth-input"
            inputMode="tel"
            placeholder="+525512345678"
            {...register('telefono')}
          />
        </Field>
        <Field label="País" error={errors.pais?.message}>
          <select
            autoComplete="country"
            className="auth-input"
            {...register('pais')}
          >
            <option value="MX">México</option>
            <option value="US">Estados Unidos</option>
            <option value="CA">Canadá</option>
            <option value="AR">Argentina</option>
            <option value="CO">Colombia</option>
            <option value="ES">España</option>
          </select>
        </Field>
        <Field label="Estado o provincia" error={errors.estado?.message}>
          <input
            autoComplete="address-level1"
            className="auth-input"
            {...register('estado')}
          />
        </Field>

        <fieldset className="md:col-span-2">
          <legend className="mb-2 text-sm text-text-secondary">Suscripción</legend>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['SUBS1', 'Subs 1', 'Plan inicial'],
              ['SUBS2', 'Subs 2', 'Plan avanzado'],
            ].map(([value, title, detail]) => (
              <label
                className="cursor-pointer rounded-xl border border-border bg-background p-3 transition has-[:checked]:border-primary-orange has-[:checked]:bg-primary-orange/10"
                key={value}
              >
                <input
                  className="sr-only"
                  defaultChecked={value === 'SUBS1'}
                  type="radio"
                  value={value}
                  {...register('suscripcion')}
                />
                <span className="block font-semibold">{title}</span>
                <span className="text-xs text-text-secondary">{detail}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Contraseña" error={errors.password?.message}>
          <div className="relative">
            <input
              autoComplete="new-password"
              className="auth-input pr-12"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
            />
            <PasswordToggle
              visible={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            />
          </div>
        </Field>
        <Field
          label="Confirmar contraseña"
          error={errors.confirmacion?.message}
        >
          <input
            autoComplete="new-password"
            className="auth-input"
            type={showPassword ? 'text' : 'password'}
            {...register('confirmacion')}
          />
        </Field>

        <p className="text-xs text-text-secondary md:col-span-2">
          Mínimo 12 caracteres, con mayúscula, minúscula, número y símbolo.
        </p>

        {apiError ? (
          <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger md:col-span-2">
            <p>{apiError}</p>
            {activationRequired ? (
              <Link
                className="mt-2 inline-block font-semibold underline"
                href="/verificar-correo"
              >
                Activar mi cuenta
              </Link>
            ) : null}
          </div>
        ) : null}

        <Button
          className="w-full md:col-span-2"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-secondary">
        ¿Ya tienes cuenta?{' '}
        <Link className="font-semibold text-primary-blue" href="/login">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}

function Field({
  label,
  error,
  children,
  className = '',
}: {
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1.5 block text-text-secondary">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

function PasswordToggle({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  const Icon = visible ? EyeOff : Eye;
  return (
    <button
      aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      className="absolute inset-y-0 right-0 grid w-12 place-items-center text-text-secondary hover:text-primary-orange"
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" size={18} />
    </button>
  );
}
