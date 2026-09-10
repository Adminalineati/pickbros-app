const LIGAS = ['MLB', 'NBA', 'NFL', 'Champions'];
const BASE_URL = 'https://sports.highlightly.net';

const CONFIGURACION = {
  MLB: {
    path: '/baseball/matches',
    params: { league: 'MLB' },
  },
  NBA: {
    path: '/nba/matches',
    params: { league: 'NBA' },
  },
  NFL: {
    path: '/american-football/matches',
    params: { league: 'NFL' },
  },
  Champions: {
    path: '/football/matches',
    params: { leagueName: 'UEFA Champions League' },
  },
};

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

export function fechasParaEjecucion({
  now = new Date(),
  zonaHoraria = 'America/Mexico_City',
  diasPasados = 2,
  diasFuturos = 14,
  modo = 'rapido',
} = {}) {
  const hoy = fechaEnZona(now, zonaHoraria);
  const ventana = Array.from({ length: diasPasados + diasFuturos + 1 }, (_, index) =>
    sumarDias(hoy, index - diasPasados),
  );

  if (modo === 'rapido') {
    return {
      hoy,
      desde: ventana[0],
      hasta: ventana.at(-1),
      fechas: [hoy],
    };
  }

  const otrasFechas = ventana.filter((fecha) => fecha !== hoy);
  const bloque = Math.floor(now.getUTCHours() / 6) % 4;

  return {
    hoy,
    desde: ventana[0],
    hasta: ventana.at(-1),
    fechas: [hoy, ...otrasFechas.filter((_, index) => index % 4 === bloque)].sort(),
  };
}

function limpiarTexto(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function codigoEquipo(team) {
  const explicit = team?.abbreviation ?? team?.code;
  if (explicit) return String(explicit).toUpperCase().slice(0, 4);

  return String(team?.displayName ?? team?.name ?? 'TBD')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 4);
}

function equipo(team) {
  const nombre = limpiarTexto(team?.displayName ?? team?.name) || 'Por definir';
  const logo = limpiarTexto(team?.logo);

  return {
    id: String(team?.id ?? nombre),
    nombre: String(nombre),
    codigo: codigoEquipo(team),
    ...(logo ? { logoUrl: String(logo) } : {}),
  };
}

function numero(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sumarPeriodos(value) {
  if (!Array.isArray(value)) return undefined;
  const values = value.map(numero).filter((item) => item !== undefined);
  return values.length ? values.reduce((total, item) => total + item, 0) : undefined;
}

function parsearMarcador(value) {
  if (typeof value !== 'string') return {};
  const match = value.match(/(-?\d+)\s*[-–:]\s*(-?\d+)/);
  if (!match) return {};
  return {
    marcadorLocal: Number(match[1]),
    marcadorVisitante: Number(match[2]),
  };
}

function marcadoresDe(raw) {
  const score = raw?.state?.score ?? {};
  const current = parsearMarcador(score.current);
  if (current.marcadorLocal !== undefined && current.marcadorVisitante !== undefined) {
    return current;
  }

  const marcadorLocal =
    sumarPeriodos(score.homeTeam) ??
    numero(score.home?.total ?? score.home?.runs ?? score.home);
  const marcadorVisitante =
    sumarPeriodos(score.awayTeam) ??
    numero(score.away?.total ?? score.away?.runs ?? score.away);

  return {
    ...(marcadorLocal !== undefined ? { marcadorLocal } : {}),
    ...(marcadorVisitante !== undefined ? { marcadorVisitante } : {}),
  };
}

function estadoDe(raw) {
  const detalle = String(raw?.state?.description ?? 'Programado');
  const report = String(raw?.state?.report ?? raw?.state?.score?.report ?? '');
  const combined = `${detalle} ${report}`.toLowerCase();

  if (/(finished|final|ended|after penalties|after extra|after over)/.test(combined)) {
    return { estado: 'FINALIZADO', detalle: report || detalle };
  }
  if (/(postponed|suspended|rain delay|interrupted)/.test(combined)) {
    return { estado: 'POSPUESTO', detalle };
  }
  if (/(cancelled|canceled|abandoned)/.test(combined)) {
    return { estado: 'CANCELADO', detalle };
  }
  if (/(not started|scheduled|to be announced|unknown|programado)/.test(combined)) {
    return { estado: 'PROGRAMADO', detalle };
  }
  return { estado: 'EN_VIVO', detalle };
}

export function normalizarEvento(raw, liga) {
  const id = raw?.id;
  const home = raw?.homeTeam;
  const away = raw?.awayTeam;
  const startsAt = new Date(raw?.date);

  if (!id || !home || !away || Number.isNaN(startsAt.getTime())) {
    throw new Error('El evento no contiene id, fecha o equipos');
  }

  const status = estadoDe(raw);
  const league = raw?.league;
  const competition = typeof league === 'object' ? league?.name : league;
  const season = typeof league === 'object' ? league?.season : raw?.season;

  return {
    id: `highlightly:${liga.toLowerCase()}:${id}`,
    liga,
    competicion: String(competition ?? liga),
    temporada: String(season ?? ''),
    iniciaEn: startsAt.toISOString(),
    estado: status.estado,
    estadoDetalle: status.detalle,
    local: equipo(home),
    visitante: equipo(away),
    ...marcadoresDe(raw),
    ...(raw?.venue?.name ? { sede: String(raw.venue.name) } : {}),
    ...(raw?.round ? { fase: String(raw.round) } : {}),
  };
}

async function consultarFecha(liga, fecha, key, zonaHoraria, fetchImpl) {
  const config = CONFIGURACION[liga];
  const url = new URL(config.path, BASE_URL);
  const params = {
    ...config.params,
    date: fecha,
    timezone: zonaHoraria,
    limit: 100,
  };
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, String(value));
  }

  const response = await fetchImpl(url, {
    headers: { 'x-rapidapi-key': key },
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message ?? payload?.error ?? `HTTP ${response.status}`;
    throw new Error(`${message} al consultar ${liga} (${fecha})`);
  }
  if (!Array.isArray(payload?.data)) {
    throw new Error(`Respuesta inválida de ${liga} (${fecha})`);
  }

  return payload.data;
}

function dentroDeVentana(event, desde, hasta, zonaHoraria) {
  try {
    const fecha = fechaEnZona(new Date(event.iniciaEn), zonaHoraria);
    return fecha >= desde && fecha <= hasta;
  } catch {
    return false;
  }
}

export async function sincronizarDeportes({
  key,
  now = new Date(),
  zonaHoraria = 'America/Mexico_City',
  diasPasados = 2,
  diasFuturos = 14,
  modo = 'rapido',
  anterior,
  fetchImpl = fetch,
}) {
  if (!key) throw new Error('Falta HIGHLIGHTLY_API_KEY');

  const { desde, hasta, fechas } = fechasParaEjecucion({
    now,
    zonaHoraria,
    diasPasados,
    diasFuturos,
    modo,
  });
  const eventos = new Map(
    (anterior?.eventos ?? [])
      .filter((event) => dentroDeVentana(event, desde, hasta, zonaHoraria))
      .map((event) => [event.id, event]),
  );
  const fuentes = [];
  let consultasCorrectas = 0;

  for (const liga of LIGAS) {
    const errors = [];
    for (const fecha of fechas) {
      try {
        const raws = await consultarFecha(liga, fecha, key, zonaHoraria, fetchImpl);
        consultasCorrectas += 1;

        for (const [id, event] of eventos) {
          if (
            event.liga === liga &&
            fechaEnZona(new Date(event.iniciaEn), zonaHoraria) === fecha
          ) {
            eventos.delete(id);
          }
        }

        for (const raw of raws) {
          try {
            const event = normalizarEvento(raw, liga);
            if (dentroDeVentana(event, desde, hasta, zonaHoraria)) {
              eventos.set(event.id, event);
            }
          } catch {
            // Un registro defectuoso no invalida los demás eventos de la fecha.
          }
        }
      } catch (cause) {
        errors.push(cause instanceof Error ? cause.message : 'Error desconocido');
      }
    }

    const eventosLiga = [...eventos.values()].filter(
      (event) => event.liga === liga,
    ).length;
    fuentes.push({
      liga,
      ok: errors.length < fechas.length,
      eventos: eventosLiga,
      ...(errors.length ? { error: errors.join(' | ') } : {}),
    });
  }

  if (consultasCorrectas === 0 && eventos.size === 0) {
    throw new Error(
      `Highlightly no respondió para ninguna liga: ${fuentes
        .map((source) => `${source.liga}: ${source.error}`)
        .join(' | ')}`,
    );
  }

  return {
    version: 1,
    proveedor: 'highlightly',
    actualizadoEn: now.toISOString(),
    zonaHoraria,
    ventana: { desde, hasta },
    eventos: [...eventos.values()].sort((a, b) => a.iniciaEn.localeCompare(b.iniciaEn)),
    fuentes,
  };
}
