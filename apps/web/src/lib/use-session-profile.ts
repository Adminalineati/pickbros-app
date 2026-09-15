'use client';

import { useEffect, useState } from 'react';
import {
  authenticatedApiFetch,
  currentUser,
  patchSessionUser,
  sessionEventName,
  type SessionUser,
} from '@/lib/local-auth';

export function useSessionProfile(fallback?: {
  pickCoins: number;
  pickets: number;
  rachaDias: number;
  nivel: number;
  rango: string;
  saludo: string;
}) {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [stats, setStats] = useState({
    pickCoins: fallback?.pickCoins ?? 0,
    pickets: fallback?.pickets ?? 0,
    rachaDias: fallback?.rachaDias ?? 0,
    nivel: fallback?.nivel ?? 1,
    rango: fallback?.rango ?? 'Rookie',
    saludo: fallback?.saludo ?? '¿Qué onda!',
  });
  const sessionUserId = sessionUser?.id;

  useEffect(() => {
    const sync = () => {
      const user = currentUser();
      setSessionUser(user);
      if (user) {
        setStats((current) => ({
          pickCoins: user.pickCoins ?? current.pickCoins,
          pickets: user.pickets ?? current.pickets,
          rachaDias: user.rachaDias ?? current.rachaDias,
          nivel: user.nivel ?? current.nivel,
          rango: user.rango ?? current.rango,
          saludo: `¿Qué onda, ${user.nombre}! 👋`,
        }));
      }
    };
    sync();
    window.addEventListener(sessionEventName(), sync);
    return () => window.removeEventListener(sessionEventName(), sync);
  }, []);

  useEffect(() => {
    if (!sessionUserId) return;
    const controller = new AbortController();
    void authenticatedApiFetch('/auth/me', {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<SessionUser>;
      })
      .then((profile) => {
        if (!profile || controller.signal.aborted) return;
        patchSessionUser(profile);
        setStats({
          pickCoins: profile.pickCoins ?? 0,
          pickets: profile.pickets ?? 0,
          rachaDias: profile.rachaDias ?? 0,
          nivel: profile.nivel ?? 1,
          rango: profile.rango ?? 'Rookie',
          saludo: `¿Qué onda, ${profile.nombre}! 👋`,
        });
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [sessionUserId]);

  return { sessionUser, ...stats };
}
