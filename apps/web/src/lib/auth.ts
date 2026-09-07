'use client';

import { UserManager, type UserManagerSettings } from 'oidc-client-ts';

let manager: UserManager | undefined;

function settings(): UserManagerSettings | null {
  const authority = process.env.NEXT_PUBLIC_COGNITO_AUTHORITY;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;

  if (!authority || !clientId || !redirectUri) {
    return null;
  }

  return {
    authority,
    client_id: clientId,
    redirect_uri: redirectUri,
    post_logout_redirect_uri:
      process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI ?? window.location.origin,
    response_type: 'code',
    scope: 'openid email profile',
  };
}

export function authConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_COGNITO_AUTHORITY &&
      process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID &&
      process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI,
  );
}

export function authManager(): UserManager {
  if (manager) {
    return manager;
  }

  const configuration = settings();
  if (!configuration) {
    throw new Error('Cognito no está configurado en este ambiente.');
  }

  manager = new UserManager(configuration);
  return manager;
}
