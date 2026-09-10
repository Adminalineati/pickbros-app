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
  BIRTHDATE_RANGE_MESSAGE,
  isEligibleBirthDate,
} from '@/lib/birthdate';
import { codigoTelefonoDe, estadosDe, PAISES } from '@/lib/locations';
import {
  ApiError,
  cognitoUserPoolConfigured,
  register as registerUser,
} from '@/lib/local-auth';

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,72}$/;

const E164_PHONE = /^\+[1-9]\d{7,14}$/;

const schema = z
  .object({
    nombre: z.string().trim().min(2, 'Escribe tu nombre'),
    apellido: z.string().trim().min(2, 'Escribe tu apellido'),
    correo: z.string().email('Escribe un correo válido'),
    fechaNacimiento: z
      .string()
      .min(1, 'Selecciona tu fecha de nacimiento')
      .refine(isEligibleBirthDate, BIRTHDATE_RANGE_MESSAGE),
    telefonoLocal: z
      .string()
      .regex(/^\d{8,14}$/, 'Ingresa tu número sin el código de país'),
    pais: z.string().length(2, 'Selecciona tu país'),
    estado: z.string().trim().min(1, 'Selecciona tu estado o provincia'),
    password: z
      .string()
      .regex(
        passwordPattern,
        'Usa 12 caracteres con mayúscula, minúscula, número y símbolo',
      ),
    confirmacion: z.string(),
  })
  .refine((data) => data.password === data.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  })
  .refine((data) => estadosDe(data.pais).includes(data.estado), {
    message: 'Selecciona un estado o provincia de la lista',
    path: ['estado'],
  })
  .refine(
    (data) =>
      E164_PHONE.test(`${codigoTelefonoDe(data.pais)}${data.telefonoLocal}`),
    {
      message: 'Ingresa un número de celular válido',
      path: ['telefonoLocal'],
    },
  );

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
    setValue,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      pais: 'MX',
      estado: '',
      telefonoLocal: '',
    },
  });
  const pais = watch('pais');
  const estado = watch('estado');
  const fechaNacimiento = watch('fechaNacimiento');
  const estados = estadosDe(pais);
  const codigoTelefono = codigoTelefonoDe(pais);
  const ubicacionCompleta = Boolean(pais && estado);
  const birthDateOutOfRange =
    Boolean(fechaNacimiento) && !isEligibleBirthDate(fechaNacimiento);

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
      const telefono = `${codigoTelefonoDe(result.data.pais)}${result.data.telefonoLocal}`;
      const response = await registerUser({
        nombre: result.data.nombre,
        apellido: result.data.apellido,
        correo: result.data.correo,
        password: result.data.password,
        fechaNacimiento: result.data.fechaNacimiento,
        telefono,
        pais: result.data.pais,
        estado: result.data.estado,
        suscripcion: 'FREE',
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
      subtitle="Completa tus datos y verifica tu correo."
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
          className="md:col-span-2"
          label="Fecha de nacimiento"
          hint={BIRTHDATE_RANGE_MESSAGE}
          error={errors.fechaNacimiento?.message}
        >
          <input
            autoComplete="bday"
            className="auth-input"
            type="date"
            {...register('fechaNacimiento', {
              onChange: (event) => {
                const value = event.target.value;
                if (value && !isEligibleBirthDate(value)) {
                  setError('fechaNacimiento', {
                    message: BIRTHDATE_RANGE_MESSAGE,
                  });
                  return;
                }
                clearErrors('fechaNacimiento');
              },
            })}
          />
        </Field>
        <Field label="País" error={errors.pais?.message}>
          <select
            autoComplete="country"
            className="auth-input"
            {...register('pais', {
              onChange: () => {
                setValue('estado', '');
                setValue('telefonoLocal', '');
              },
            })}
          >
            {PAISES.map((item) => (
              <option key={item.codigo} value={item.codigo}>
                {item.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado o provincia" error={errors.estado?.message}>
          <select
            autoComplete="address-level1"
            className="auth-input"
            {...register('estado', {
              onChange: () => setValue('telefonoLocal', ''),
            })}
          >
            <option value="">Selecciona tu estado</option>
            {estados.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <Field
          className="md:col-span-2"
          label="Teléfono celular"
          hint={
            ubicacionCompleta
              ? undefined
              : 'Primero selecciona tu país y estado'
          }
          error={errors.telefonoLocal?.message}
        >
          <div className="auth-input-group">
            <span aria-hidden="true" className="auth-input-prefix">
              {codigoTelefono}
            </span>
            <input
              autoComplete="tel-national"
              className="auth-input"
              disabled={!ubicacionCompleta}
              inputMode="numeric"
              placeholder="5512345678"
              {...register('telefonoLocal', {
                onChange: (event) => {
                  const digits = event.target.value.replace(/\D/g, '');
                  if (digits !== event.target.value) {
                    setValue('telefonoLocal', digits);
                  }
                },
              })}
            />
          </div>
        </Field>

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
          disabled={isSubmitting || birthDateOutOfRange}
          type="submit"
        >
          {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-text-secondary">
        ¿Ya tienes cuenta?{' '}
        <Link className="font-semibold text-primary-orange" href="/login">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}

function Field({
  label,
  error,
  hint,
  children,
  className = '',
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  const message = error ?? hint;
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1.5 block text-text-secondary">{label}</span>
      {children}
      {message ? (
        <span
          className={`mt-1 block text-xs ${error ? 'text-danger' : 'text-text-secondary'}`}
        >
          {message}
        </span>
      ) : null}
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
