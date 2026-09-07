import type { League } from '@prisma/client';

export interface EventoProveedor {
  externalId: string;
  league: League;
  homeExternalId: string;
  awayExternalId: string;
  homeName: string;
  awayName: string;
  startsAt: Date;
  homeScore?: number;
  awayScore?: number;
  rawPayload: unknown;
}

export interface ProveedorDeportivo {
  readonly slug: string;
  obtenerEventos(desde: Date, hasta: Date): Promise<EventoProveedor[]>;
}
