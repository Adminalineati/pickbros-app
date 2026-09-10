import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fechasParaEjecucion,
  normalizarEvento,
  sincronizarDeportes,
} from './highlightly.mjs';

test('modo rapido consulta solo el dia actual para caber en 96 solicitudes diarias', () => {
  const run = fechasParaEjecucion({
    now: new Date('2026-09-07T18:17:00.000Z'),
    zonaHoraria: 'UTC',
  });

  assert.deepEqual(run.fechas, ['2026-09-07']);
  assert.equal(24 * run.fechas.length * 4, 96);
});

test('modo completo reparte la ventana en cuatro bloques dentro de 80 consultas diarias', () => {
  const runs = [0, 6, 12, 18].map((hour) =>
    fechasParaEjecucion({
      now: new Date(`2026-09-07T${String(hour).padStart(2, '0')}:17:00.000Z`),
      zonaHoraria: 'UTC',
      modo: 'completo',
    }),
  );

  assert.ok(runs.every((run) => run.fechas.length === 5));
  assert.ok(runs.every((run) => run.fechas.includes('2026-09-07')));

  const covered = new Set(runs.flatMap((run) => run.fechas));
  assert.equal(covered.size, 17);
  assert.equal(runs.length * 5 * 4, 80);
});

test('normaliza un partido de Champions en vivo', () => {
  const event = normalizarEvento(
    {
      id: 91,
      round: 'League phase - 1',
      date: '2026-09-08T19:00:00.000Z',
      league: {
        id: 104,
        name: 'UEFA Champions League',
        season: 2026,
      },
      homeTeam: {
        id: 1,
        name: 'Real Madrid',
        logo: ' https://highlightly.net/images/real.png ',
      },
      awayTeam: { id: 2, name: 'Dortmund' },
      state: {
        description: 'Second half',
        score: { current: '3 - 1' },
      },
    },
    'Champions',
  );

  assert.equal(event.estado, 'EN_VIVO');
  assert.equal(event.marcadorLocal, 3);
  assert.equal(event.marcadorVisitante, 1);
  assert.equal(event.local.codigo, 'RM');
  assert.equal(event.local.logoUrl, 'https://highlightly.net/images/real.png');
  assert.equal(event.competicion, 'UEFA Champions League');
});

test('marca como finalizado un partido NFL con report Final aunque description diga In progress', () => {
  const event = normalizarEvento(
    {
      id: 55,
      league: 'NFL',
      season: 2026,
      date: '2026-09-10T00:00:00.000Z',
      state: {
        description: 'In progress',
        report: 'Final',
        score: { current: '21 - 7', homeTeam: 21, awayTeam: 7 },
      },
      homeTeam: {
        id: 1,
        displayName: 'Seattle Seahawks',
        abbreviation: 'SEA',
      },
      awayTeam: {
        id: 2,
        displayName: 'New England Patriots',
        abbreviation: 'NE',
      },
    },
    'NFL',
  );

  assert.equal(event.estado, 'FINALIZADO');
  assert.equal(event.marcadorLocal, 21);
  assert.equal(event.marcadorVisitante, 7);
});

test('suma los periodos y normaliza un resultado NBA', () => {
  const event = normalizarEvento(
    {
      id: 44,
      league: 'NBA',
      season: 2026,
      date: '2026-09-09T01:30:00.000Z',
      state: {
        description: 'Finished',
        score: {
          homeTeam: [25, 30, 20, 25],
          awayTeam: [20, 24, 28, 24],
        },
      },
      homeTeam: {
        id: 10,
        displayName: 'Los Angeles Lakers',
        abbreviation: 'LAL',
      },
      awayTeam: {
        id: 20,
        displayName: 'Denver Nuggets',
        abbreviation: 'DEN',
      },
    },
    'NBA',
  );

  assert.equal(event.estado, 'FINALIZADO');
  assert.equal(event.marcadorLocal, 100);
  assert.equal(event.marcadorVisitante, 96);
  assert.equal(event.local.codigo, 'LAL');
});

test('conserva la fecha anterior si una consulta de Highlightly falla', async () => {
  const previous = {
    id: 'highlightly:nba:previous',
    liga: 'NBA',
    iniciaEn: '2026-09-06T18:00:00.000Z',
  };

  const snapshot = await sincronizarDeportes({
    key: 'test',
    now: new Date('2026-09-07T06:17:00.000Z'),
    zonaHoraria: 'UTC',
    modo: 'completo',
    anterior: { eventos: [previous] },
    fetchImpl: async (url) => {
      const isFailedDate =
        url.pathname === '/nba/matches' && url.searchParams.get('date') === '2026-09-06';
      return {
        ok: !isFailedDate,
        status: isFailedDate ? 503 : 200,
        json: async () =>
          isFailedDate
            ? { message: 'Servicio temporalmente no disponible' }
            : { data: [] },
      };
    },
  });

  assert.equal(snapshot.eventos[0].id, previous.id);
  assert.equal(snapshot.proveedor, 'highlightly');
  assert.equal(snapshot.fuentes.find((source) => source.liga === 'NBA').ok, true);
  assert.match(
    snapshot.fuentes.find((source) => source.liga === 'NBA').error,
    /Servicio temporalmente no disponible/,
  );
});
