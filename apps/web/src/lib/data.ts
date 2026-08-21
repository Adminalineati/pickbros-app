import type { DashboardRespuesta, TiendaRespuesta } from '@pickbros/types';
import { dashboardMock, tiendaMock } from '@/lib/mocks';
import { dashboardSchema, tiendaSchema } from '@/lib/schemas';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function leerJson<T>(ruta: string, schema: { parse: (data: unknown) => T }, fallback: T): Promise<T> {
  if (!API_URL) {
    return fallback;
  }

  try {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      signal: AbortSignal.timeout(2500),
    });

    if (!respuesta.ok) {
      return fallback;
    }

    const json: unknown = await respuesta.json();
    return schema.parse(json);
  } catch {
    return fallback;
  }
}

/** Intenta el API y, si no está, usa mocks locales para que la demo no se caiga. */
export async function obtenerDashboard(): Promise<DashboardRespuesta> {
  return leerJson('/dashboard', dashboardSchema, dashboardMock);
}

export async function obtenerTienda(): Promise<TiendaRespuesta> {
  return leerJson('/store', tiendaSchema, tiendaMock);
}
