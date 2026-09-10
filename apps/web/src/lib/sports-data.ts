import type {
  CalendarioDeportivo,
  ChallengeDelDia,
  EventoDeportivo,
  EventoDestacado,
  LigaDeportiva,
} from '@pickbros/types';

const ligas: LigaDeportiva[] = ['MLB', 'NBA', 'NFL', 'Champions'];
const acentos: Record<LigaDeportiva, { local: string; visitante: string }> = {
  MLB: { local: '#2EA8FF', visitante: '#FF6A1A' },
  NBA: { local: '#FF6A1A', visitante: '#2EA8FF' },
  NFL: { local: '#22C55E', visitante: '#FF6A1A' },
  Champions: { local: '#2EA8FF', visitante: '#94A3B8' },
};

export function esCalendarioDeportivo(value: unknown): value is CalendarioDeportivo {
  if (!value || typeof value !== 'object') return false;
  const data = value as Partial<CalendarioDeportivo>;
  return (
    data.version === 1 &&
    typeof data.actualizadoEn === 'string' &&
    typeof data.zonaHoraria === 'string' &&
    Array.isArray(data.eventos) &&
    Array.isArray(data.fuentes)
  );
}

export async function cargarCalendarioDeportivo(signal?: AbortSignal) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const response = await fetch(`${basePath}/data/sports.json`, {
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error('No pudimos cargar el calendario deportivo.');

  const body: unknown = await response.json();
  if (!esCalendarioDeportivo(body)) {
    throw new Error('El calendario deportivo tiene un formato inválido.');
  }
  return calendarioConAgenda(body);
}

export function horarioEvento(evento: EventoDeportivo, zonaHoraria: string) {
  const startsAt = new Date(evento.iniciaEn);
  const date = new Intl.DateTimeFormat('es-MX', {
    timeZone: zonaHoraria,
    day: 'numeric',
    month: 'short',
  }).format(startsAt);
  const time = new Intl.DateTimeFormat('es-MX', {
    timeZone: zonaHoraria,
    hour: 'numeric',
    minute: '2-digit',
  }).format(startsAt);
  return `${date} · ${time}`;
}

function eventoDemo(
  id: string,
  liga: LigaDeportiva,
  local: EventoDeportivo['local'],
  visitante: EventoDeportivo['visitante'],
  iniciaEn: string,
): EventoDeportivo {
  return {
    id,
    liga,
    competicion: liga,
    temporada: '2026',
    iniciaEn,
    estado: 'PROGRAMADO',
    estadoDetalle: 'Programado',
    local,
    visitante,
  };
}

export function eventosDemo(now = new Date()): EventoDeportivo[] {
  const hoursFromNow = (hours: number) =>
    new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();

  return [
    eventoDemo(
      'demo-mlb-futuro',
      'MLB',
      { id: 'nyy', nombre: 'Yankees', codigo: 'NYY' },
      { id: 'bos', nombre: 'Red Sox', codigo: 'BOS' },
      hoursFromNow(8),
    ),
    eventoDemo(
      'demo-nba-futuro',
      'NBA',
      { id: 'lal', nombre: 'Lakers', codigo: 'LAL' },
      { id: 'den', nombre: 'Nuggets', codigo: 'DEN' },
      hoursFromNow(26),
    ),
    eventoDemo(
      'demo-nfl-futuro',
      'NFL',
      { id: 'kc', nombre: 'Chiefs', codigo: 'KC' },
      { id: 'cin', nombre: 'Bengals', codigo: 'CIN' },
      hoursFromNow(50),
    ),
    eventoDemo(
      'demo-ucl-futuro',
      'Champions',
      { id: 'rma', nombre: 'Real Madrid', codigo: 'RMA' },
      { id: 'bvb', nombre: 'Dortmund', codigo: 'BVB' },
      hoursFromNow(32),
    ),
  ];
}

export function calendarioConAgenda(
  snapshot: CalendarioDeportivo,
  now = new Date(),
): CalendarioDeportivo {
  if (snapshot.eventos.length > 0) return snapshot;

  return {
    ...snapshot,
    proveedor: 'demo',
    eventos: eventosDemo(now),
  };
}

export function eventoChallenge(
  snapshot: CalendarioDeportivo,
  now = Date.now(),
): EventoDeportivo | undefined {
  const upcoming = [...snapshot.eventos]
    .filter(
      (event) =>
        event.estado === 'PROGRAMADO' && new Date(event.iniciaEn).getTime() >= now,
    )
    .sort((a, b) => a.iniciaEn.localeCompare(b.iniciaEn));

  return upcoming[0];
}

export function challengeDesdeCalendario(
  snapshot: CalendarioDeportivo,
  premioPickCoins = 150,
  now = Date.now(),
): ChallengeDelDia | null {
  const event = eventoChallenge(snapshot, now);
  if (!event) return null;

  const color = acentos[event.liga];
  return {
    titulo: 'Pick Challenge del día',
    pregunta: `¿Quién gana este duelo de ${event.liga}?`,
    local: {
      nombre: event.local.nombre,
      iniciales: event.local.codigo,
      acento: color.local,
      logoUrl: event.local.logoUrl,
    },
    visitante: {
      nombre: event.visitante.nombre,
      iniciales: event.visitante.codigo,
      acento: color.visitante,
      logoUrl: event.visitante.logoUrl,
    },
    horario: horarioEvento(event, snapshot.zonaHoraria),
    premioPickCoins,
  };
}

export function eventosDestacados(snapshot: CalendarioDeportivo): EventoDestacado[] {
  const now = Date.now();
  const ordered = [...snapshot.eventos].sort((a, b) => {
    const priority = (event: EventoDeportivo) => {
      if (event.estado === 'EN_VIVO') return 0;
      if (new Date(event.iniciaEn).getTime() >= now) return 1;
      return 2;
    };
    return priority(a) - priority(b) || a.iniciaEn.localeCompare(b.iniciaEn);
  });

  return ligas
    .map((liga) => ordered.find((event) => event.liga === liga))
    .filter((event): event is EventoDeportivo => Boolean(event))
    .map((event) => ({
      id: event.id,
      liga: event.liga,
      local: event.local.nombre,
      visitante: event.visitante.nombre,
      inicialesLocal: event.local.codigo,
      inicialesVisitante: event.visitante.codigo,
      horario: horarioEvento(event, snapshot.zonaHoraria),
      logoLocal: event.local.logoUrl,
      logoVisitante: event.visitante.logoUrl,
      estado: event.estado,
      marcadorLocal: event.marcadorLocal,
      marcadorVisitante: event.marcadorVisitante,
    }));
}
