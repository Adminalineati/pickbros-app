const LIGAS = ['MLB', 'NBA', 'NFL', 'Champions'];

const CONFIGURACION = {
  MLB: {
    baseUrl: 'https://v1.baseball.api-sports.io',
    path: '/games',
    league: 1,
  },
  NBA: {
    baseUrl: 'https://v2.nba.api-sports.io',
    path: '/games',
  },
  NFL: {
    baseUrl: 'https://v1.american-football.api-sports.io',
    path: '/games',
    league: 1,
  },
  Champions: {
    baseUrl: 'https://v3.football.api-sports.io',
    path: '/fixtures',
    league: 2,
  },
};

export function temporadaActual(liga, now = new Date()) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  if (liga === 'NBA' || liga === 'Champions') {
    return String(month >= 7 ? year : year - 1);
  }
  return String(year);
}

export function fechaEnZona(date, zonaHoraria) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zonaHoraria,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function sumarDias(fecha, dias) {
  const value = new Date(`${fecha}T12:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + dias);
  return value.toISOString().slice(0, 10);
}

function codigoEquipo(team) {
  const explicit = team?.code ?? team?.abbreviation;
  if (explicit) return String(explicit).toUpperCase().slice(0, 4);

  return String(team?.name ?? 'TBD')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 4);
}

function equipo(team) {
  return {
    id: String(team?.id ?? team?.name ?? 'tbd'),
    nombre: String(team?.name ?? 'Por definir'),
    codigo: codigoEquipo(team),
    ...(team?.logo ? { logoUrl: String(team.logo) } : {}),
  };
}

function numero(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function inicioDe(raw) {
  const date = raw?.fixture?.date ?? raw?.date?.start ?? raw?.date;
  if (typeof date === 'string') return new Date(date).toISOString();

  const timestamp = date?.timestamp ?? raw?.timestamp;
  if (timestamp) return new Date(Number(timestamp) * 1000).toISOString();

  if (date?.date) {
    const time = date.time || '00:00';
    return new Date(`${date.date}T${time}:00.000Z`).toISOString();
  }

  throw new Error('El evento no contiene una fecha válida');
}

function estadoDe(raw, liga) {
  const short = raw?.fixture?.status?.short ?? raw?.status?.short;
  const long = String(
    raw?.fixture?.status?.long ?? raw?.status?.long ?? short ?? 'Programado',
  );

  if (liga === 'NBA' && typeof short === 'number') {
    if (short === 3) return { estado: 'FINALIZADO', detalle: long };
    if (short === 2) return { estado: 'EN_VIVO', detalle: long };
    return { estado: 'PROGRAMADO', detalle: long };
  }

  const code = String(short ?? '').toUpperCase();
  if (['FT', 'AET', 'PEN', 'FINAL', 'FINISHED'].includes(code)) {
    return { estado: 'FINALIZADO', detalle: long };
  }
  if (['PST', 'POSTPONED', 'SUSP'].includes(code)) {
    return { estado: 'POSPUESTO', detalle: long };
  }
  if (['CANC', 'CANCELLED', 'ABD'].includes(code)) {
    return { estado: 'CANCELADO', detalle: long };
  }
  if (code && !['NS', 'TBD', 'SCHEDULED', 'NOT STARTED', '1'].includes(code)) {
    return { estado: 'EN_VIVO', detalle: long };
  }
  return { estado: 'PROGRAMADO', detalle: long };
}

export function normalizarEvento(raw, liga) {
  const status = estadoDe(raw, liga);
  const home = raw?.teams?.home;
  const away = liga === 'NBA' ? raw?.teams?.visitors : raw?.teams?.away;
  const homeScore =
    liga === 'Champions'
      ? raw?.goals?.home
      : liga === 'NBA'
        ? raw?.scores?.home?.points
        : (raw?.scores?.home?.total ?? raw?.scores?.home);
  const awayScore =
    liga === 'Champions'
      ? raw?.goals?.away
      : liga === 'NBA'
        ? raw?.scores?.visitors?.points
        : (raw?.scores?.away?.total ?? raw?.scores?.away);
  const league = raw?.league ?? {};
  const fixture = raw?.fixture ?? {};
  const id = fixture.id ?? raw?.id;

  if (!id || !home || !away) {
    throw new Error('El evento no contiene id o equipos');
  }

  return {
    id: `${liga.toLowerCase()}:${id}`,
    liga,
    competicion: String(
      liga === 'NBA' ? 'NBA' : (league.name ?? CONFIGURACION[liga].league ?? liga),
    ),
    temporada: String(league.season ?? raw?.season ?? ''),
    iniciaEn: inicioDe(raw),
    estado: status.estado,
    estadoDetalle: status.detalle,
    local: equipo(home),
    visitante: equipo(away),
    ...(numero(homeScore) !== undefined ? { marcadorLocal: numero(homeScore) } : {}),
    ...(numero(awayScore) !== undefined ? { marcadorVisitante: numero(awayScore) } : {}),
    ...(fixture.venue?.name || raw?.venue?.name || raw?.arena?.name
      ? {
          sede: String(fixture.venue?.name ?? raw?.venue?.name ?? raw?.arena?.name),
        }
      : {}),
    ...(league.round || raw?.week ? { fase: String(league.round ?? raw.week) } : {}),
  };
}

function erroresProveedor(payload) {
  if (Array.isArray(payload?.errors)) return payload.errors.filter(Boolean);
  if (payload?.errors && typeof payload.errors === 'object') {
    return Object.values(payload.errors).filter(Boolean);
  }
  return [];
}

async function consultar(liga, key, params, fetchImpl) {
  const config = CONFIGURACION[liga];
  const url = new URL(config.path, config.baseUrl);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(name, String(value));
  }

  const response = await fetchImpl(url, {
    headers: { 'x-apisports-key': key },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al consultar ${liga}`);
  }

  const payload = await response.json();
  const errors = erroresProveedor(payload);
  if (errors.length) throw new Error(errors.join('; '));
  if (!Array.isArray(payload?.response)) {
    throw new Error(`Respuesta inválida de ${liga}`);
  }
  return payload.response;
}

function parametros(liga, temporada, desde, hasta, zonaHoraria) {
  const config = CONFIGURACION[liga];
  const values = {
    season: temporada,
    league: config.league,
  };
  if (liga === 'Champions') {
    return { ...values, from: desde, to: hasta, timezone: zonaHoraria };
  }
  return values;
}

export async function sincronizarDeportes({
  key,
  now = new Date(),
  zonaHoraria = 'America/Mexico_City',
  diasPasados = 2,
  diasFuturos = 14,
  anterior,
  fetchImpl = fetch,
}) {
  if (!key) throw new Error('Falta API_SPORTS_KEY');

  const hoy = fechaEnZona(now, zonaHoraria);
  const desde = sumarDias(hoy, -diasPasados);
  const hasta = sumarDias(hoy, diasFuturos);
  const eventos = [];
  const fuentes = [];

  for (const liga of LIGAS) {
    try {
      const season = temporadaActual(liga, now);
      const raws = await consultar(
        liga,
        key,
        parametros(liga, season, desde, hasta, zonaHoraria),
        fetchImpl,
      );
      const normalized = raws
        .map((raw) => {
          try {
            return normalizarEvento(raw, liga);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .filter((event) => {
          const date = fechaEnZona(new Date(event.iniciaEn), zonaHoraria);
          return date >= desde && date <= hasta;
        });

      eventos.push(...normalized);
      fuentes.push({ liga, ok: true, eventos: normalized.length });
    } catch (cause) {
      const previous = (anterior?.eventos ?? []).filter((event) => event.liga === liga);
      eventos.push(...previous);
      fuentes.push({
        liga,
        ok: false,
        eventos: previous.length,
        error: cause instanceof Error ? cause.message : 'Error desconocido',
      });
    }
  }

  if (fuentes.every((source) => !source.ok) && eventos.length === 0) {
    throw new Error(
      `API-Sports no respondió para ninguna liga: ${fuentes
        .map((source) => `${source.liga}: ${source.error}`)
        .join(' | ')}`,
    );
  }

  eventos.sort((a, b) => a.iniciaEn.localeCompare(b.iniciaEn));

  return {
    version: 1,
    proveedor: 'api-sports',
    actualizadoEn: now.toISOString(),
    zonaHoraria,
    ventana: { desde, hasta },
    eventos,
    fuentes,
  };
}
