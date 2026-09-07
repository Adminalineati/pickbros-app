import type {
  CalendarioDeportivo,
  EventoDeportivo,
  EventoDestacado,
  LigaDeportiva,
} from '@pickbros/types';

const ligas: LigaDeportiva[] = ['MLB', 'NBA', 'NFL', 'Champions'];

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
  return body;
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
