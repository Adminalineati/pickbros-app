'use client';

import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  type CognitoUserSession,
} from 'amazon-cognito-identity-js';

export type Subscription = 'free' | 'premium';
export type SubscriptionPlan = 'FREE' | 'PREMIUM';

function parseSubscription(value: unknown): Subscription {
  return String(value ?? '').toUpperCase() === 'PREMIUM' ? 'premium' : 'free';
}

export interface SessionUser {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  suscripcion: Subscription;
}

interface LoginResponse {
  usuario: SessionUser;
  expiresIn: number;
}

const USER_KEY = 'pickbros-session-user';
const SESSION_EVENT = 'pickbros-session-change';
let pool: CognitoUserPool | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly details: Record<string, unknown>,
  ) {
    super(message);
  }
}

function apiUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
}

export function cognitoUserPoolConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID &&
      process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  );
}

function cognitoPool() {
  if (pool) return pool;

  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  if (!userPoolId || !clientId) {
    throw new Error('Cognito no está configurado.');
  }

  pool = new CognitoUserPool({ UserPoolId: userPoolId, ClientId: clientId });
  return pool;
}

function cognitoUser(correo: string) {
  return new CognitoUser({ Username: correo.trim().toLowerCase(), Pool: cognitoPool() });
}

function saveUser(user: SessionUser | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
  window.dispatchEvent(new Event(SESSION_EVENT));
}

function sessionUser(session: CognitoUserSession): SessionUser {
  const payload = session.getIdToken().decodePayload() as Record<string, unknown>;
  const correo = String(payload.email ?? '');
  return {
    id: String(payload.sub ?? ''),
    nombre: String(payload.given_name ?? correo.split('@')[0] ?? 'Usuario'),
    apellido: String(payload.family_name ?? ''),
    correo,
    suscripcion: parseSubscription(payload['custom:subscription']),
  };
}

function authError(
  cause: unknown,
  fallback: string,
  details: Record<string, unknown> = {},
) {
  const value = cause as { name?: string; code?: string; message?: string };
  const code = value?.name ?? value?.code ?? 'COGNITO_ERROR';
  const messages: Record<string, string> = {
    CodeMismatchException: 'El código de verificación no es correcto.',
    ExpiredCodeException: 'El código expiró. Solicita uno nuevo.',
    InvalidPasswordException:
      'Usa 12 caracteres con mayúscula, minúscula, número y símbolo.',
    LimitExceededException: 'Se alcanzó el límite de intentos. Espera unos minutos.',
    NotAuthorizedException: 'El correo o la contraseña no son correctos.',
    TooManyFailedAttemptsException:
      'La cuenta está bloqueada temporalmente por varios intentos fallidos.',
    UserNotConfirmedException: 'Debes verificar tu correo antes de iniciar sesión.',
    UsernameExistsException: 'Ya existe una cuenta con este correo.',
  };

  return new ApiError(messages[code] ?? value?.message ?? fallback, {
    code,
    ...details,
  });
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const body = (await response.json()) as T & { message?: string | string[] };

  if (!response.ok) {
    throw new ApiError(
      Array.isArray(body.message)
        ? body.message.join('. ')
        : body.message || 'No se pudo completar la solicitud',
      body as Record<string, unknown>,
    );
  }

  return body;
}

export async function register(input: {
  nombre: string;
  apellido: string;
  correo: string;
  password: string;
  fechaNacimiento: string;
  telefono: string;
  pais: string;
  estado: string;
  suscripcion: SubscriptionPlan;
}): Promise<{
  mensaje: string;
  requiereVerificacion: boolean;
  codigoDemo?: string;
  usuario: SessionUser;
}> {
  if (cognitoUserPoolConfigured()) {
    const attributes = [
      new CognitoUserAttribute({ Name: 'given_name', Value: input.nombre.trim() }),
      new CognitoUserAttribute({ Name: 'family_name', Value: input.apellido.trim() }),
      new CognitoUserAttribute({ Name: 'birthdate', Value: input.fechaNacimiento }),
      new CognitoUserAttribute({ Name: 'phone_number', Value: input.telefono }),
      new CognitoUserAttribute({ Name: 'custom:country', Value: input.pais }),
      new CognitoUserAttribute({ Name: 'custom:state', Value: input.estado.trim() }),
      new CognitoUserAttribute({
        Name: 'custom:subscription',
        Value: input.suscripcion,
      }),
    ];

    return new Promise<{
      mensaje: string;
      requiereVerificacion: boolean;
      usuario: SessionUser;
    }>((resolve, reject) => {
      cognitoPool().signUp(
        input.correo.trim().toLowerCase(),
        input.password,
        attributes,
        [],
        (error, result) => {
          if (error || !result) {
            reject(
              authError(error, 'No pudimos crear la cuenta.', {
                activationRequired:
                  (error as { name?: string } | null)?.name ===
                  'UsernameExistsException',
              }),
            );
            return;
          }

          resolve({
            mensaje: 'Cuenta creada. Revisa tu correo para activarla.',
            requiereVerificacion: !result.userConfirmed,
            usuario: {
              id: result.userSub ?? '',
              nombre: input.nombre.trim(),
              apellido: input.apellido.trim(),
              correo: input.correo.trim().toLowerCase(),
              suscripcion: parseSubscription(input.suscripcion),
            },
          });
        },
      );
    });
  }

  return request<{
    mensaje: string;
    requiereVerificacion: boolean;
    codigoDemo?: string;
    usuario: SessionUser;
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function login(correo: string, password: string) {
  if (cognitoUserPoolConfigured()) {
    return new Promise<SessionUser>((resolve, reject) => {
      cognitoUser(correo).authenticateUser(
        new AuthenticationDetails({
          Username: correo.trim().toLowerCase(),
          Password: password,
        }),
        {
          onSuccess: (session) => {
            const user = sessionUser(session);
            saveUser(user);
            resolve(user);
          },
          onFailure: (error) => {
            reject(authError(error, 'No pudimos iniciar sesión.'));
          },
        },
      );
    });
  }

  const result = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo, password }),
  });

  saveUser(result.usuario);
  return result.usuario;
}

export async function logout() {
  if (cognitoUserPoolConfigured()) {
    cognitoPool().getCurrentUser()?.signOut();
    saveUser(null);
    return;
  }

  try {
    await request<{ mensaje: string }>('/auth/logout', { method: 'POST' });
  } finally {
    saveUser(null);
  }
}

export async function refreshSession() {
  if (cognitoUserPoolConfigured()) {
    const user = cognitoPool().getCurrentUser();
    if (!user) {
      saveUser(null);
      return null;
    }

    return new Promise<SessionUser | null>((resolve) => {
      user.getSession((error: Error | null, session: CognitoUserSession | null) => {
        if (error || !session?.isValid()) {
          saveUser(null);
          resolve(null);
          return;
        }

        const value = sessionUser(session);
        saveUser(value);
        resolve(value);
      });
    });
  }

  try {
    const user = await request<SessionUser>('/auth/me', { method: 'GET' });
    saveUser(user);
    return user;
  } catch {
    saveUser(null);
    return null;
  }
}

export function verifyEmail(correo: string, codigo: string) {
  if (cognitoUserPoolConfigured()) {
    return new Promise<{ mensaje: string; usuario: SessionUser }>((resolve, reject) => {
      cognitoUser(correo).confirmRegistration(codigo, true, (error) => {
        if (error) {
          reject(authError(error, 'No pudimos verificar el correo.'));
          return;
        }
        resolve({
          mensaje: 'Correo verificado correctamente.',
          usuario: {
            id: '',
            nombre: '',
            apellido: '',
            correo: correo.trim().toLowerCase(),
            suscripcion: 'free',
          },
        });
      });
    });
  }

  return request<{ mensaje: string; usuario: SessionUser }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ correo, codigo }),
  });
}

export function resendVerification(correo: string): Promise<{
  mensaje: string;
  codigoDemo?: string;
}> {
  if (cognitoUserPoolConfigured()) {
    return new Promise<{ mensaje: string }>((resolve, reject) => {
      cognitoUser(correo).resendConfirmationCode((error) => {
        if (error) {
          reject(authError(error, 'No pudimos reenviar el código.'));
          return;
        }
        resolve({ mensaje: 'Enviamos un nuevo código a tu correo.' });
      });
    });
  }

  return request<{ mensaje: string; codigoDemo?: string }>(
    '/auth/resend-verification',
    {
      method: 'POST',
      body: JSON.stringify({ correo }),
    },
  );
}

export function requestPasswordReset(correo: string): Promise<{
  mensaje: string;
  telefonoDestino?: string;
  codigoDemo?: string;
}> {
  if (cognitoUserPoolConfigured()) {
    return new Promise<{ mensaje: string; telefonoDestino?: string }>(
      (resolve, reject) => {
        cognitoUser(correo).forgotPassword({
          onSuccess: () =>
            resolve({
              mensaje: 'Solicitud completada.',
              telefonoDestino: 'tu correo registrado',
            }),
          onFailure: (error) =>
            reject(authError(error, 'No pudimos solicitar el código.')),
          inputVerificationCode: (data) =>
            resolve({
              mensaje: 'Enviamos un código para restablecer tu contraseña.',
              telefonoDestino:
                data.CodeDeliveryDetails?.Destination ?? 'tu correo registrado',
            }),
        });
      },
    );
  }

  return request<{
    mensaje: string;
    telefonoDestino?: string;
    codigoDemo?: string;
  }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ correo }),
  });
}

export function resetPassword(
  correo: string,
  codigo: string,
  password: string,
) {
  if (cognitoUserPoolConfigured()) {
    return new Promise<{ mensaje: string }>((resolve, reject) => {
      cognitoUser(correo).confirmPassword(codigo, password, {
        onSuccess: () =>
          resolve({ mensaje: 'Tu contraseña fue actualizada correctamente.' }),
        onFailure: (error) =>
          reject(authError(error, 'No pudimos actualizar la contraseña.')),
      });
    });
  }

  return request<{ mensaje: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ correo, codigo, password }),
  });
}

export function currentUser(): SessionUser | null {
  const value = localStorage.getItem(USER_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as SessionUser;
  } catch {
    void logout();
    return null;
  }
}

export function sessionEventName() {
  return SESSION_EVENT;
}
