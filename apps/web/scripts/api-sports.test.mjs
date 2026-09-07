import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizarEvento, sincronizarDeportes, temporadaActual } from './api-sports.mjs';

test('calcula temporadas que cruzan de año', () => {
  const january = new Date('2026-01-15T12:00:00.000Z');
  const september = new Date('2026-09-15T12:00:00.000Z');

  assert.equal(temporadaActual('NBA', january), '2025');
  assert.equal(temporadaActual('Champions', january), '2025');
  assert.equal(temporadaActual('NBA', september), '2026');
  assert.equal(temporadaActual('MLB', january), '2026');
});

test('normaliza un fixture de Champions finalizado', () => {
  const event = normalizarEvento(
    {
      fixture: {
        id: 91,
        date: '2026-09-08T19:00:00.000Z',
        status: { short: 'FT', long: 'Match Finished' },
        venue: { name: 'Bernabéu' },
      },
      league: { name: 'UEFA Champions League', season: 2026, round: 'League' },
      teams: {
        home: { id: 1, name: 'Real Madrid', logo: 'https://img/1.png' },
        away: { id: 2, name: 'Dortmund', logo: 'https://img/2.png' },
      },
      goals: { home: 3, away: 1 },
    },
    'Champions',
  );

  assert.equal(event.estado, 'FINALIZADO');
  assert.equal(event.marcadorLocal, 3);
  assert.equal(event.local.codigo, 'RM');
  assert.equal(event.sede, 'Bernabéu');
});

test('normaliza un juego NBA programado', () => {
  const event = normalizarEvento(
    {
      id: 44,
      league: 'standard',
      season: 2026,
      date: { start: '2026-09-09T01:30:00.000Z' },
      status: { short: 1, long: 'Scheduled' },
      teams: {
        home: { id: 10, name: 'Los Angeles Lakers', code: 'LAL' },
        visitors: { id: 20, name: 'Denver Nuggets', code: 'DEN' },
      },
      scores: {
        home: { points: null },
        visitors: { points: null },
      },
    },
    'NBA',
  );

  assert.equal(event.estado, 'PROGRAMADO');
  assert.equal(event.local.codigo, 'LAL');
  assert.equal(event.visitante.nombre, 'Denver Nuggets');
});

test('conserva la liga anterior si una fuente falla', async () => {
  const responses = new Map([
    ['v1.baseball.api-sports.io', { response: [] }],
    ['v2.nba.api-sports.io', { errors: { token: 'Llave inválida' } }],
    ['v1.american-football.api-sports.io', { response: [] }],
    ['v3.football.api-sports.io', { response: [] }],
  ]);
  const previousNba = {
    id: 'nba:1',
    liga: 'NBA',
    iniciaEn: '2026-09-07T01:00:00.000Z',
  };

  const snapshot = await sincronizarDeportes({
    key: 'test',
    now: new Date('2026-09-06T18:00:00.000Z'),
    anterior: { eventos: [previousNba] },
    fetchImpl: async (url) => ({
      ok: true,
      json: async () => responses.get(url.hostname),
    }),
  });

  assert.equal(snapshot.eventos[0].id, 'nba:1');
  assert.equal(snapshot.fuentes.find((source) => source.liga === 'NBA').ok, false);
});
