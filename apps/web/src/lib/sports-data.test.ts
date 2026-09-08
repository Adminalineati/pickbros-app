import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  calendarioConAgenda,
  challengeDesdeCalendario,
  eventoChallenge,
  eventosDemo,
} from './sports-data';
import type { CalendarioDeportivo } from '@pickbros/types';

const vacio: CalendarioDeportivo = {
  version: 1,
  proveedor: 'demo',
  actualizadoEn: '2026-09-08T16:00:00.000Z',
  zonaHoraria: 'America/Mexico_City',
  ventana: { desde: '2026-09-08', hasta: '2026-09-21' },
  eventos: [],
  fuentes: [],
};

test('si el calendario está vacío usa partidos a futuro', () => {
  const now = new Date('2026-09-08T16:00:00.000Z');
  const agenda = calendarioConAgenda(vacio, now);
  assert.equal(agenda.eventos.length, 4);
  assert.ok(agenda.eventos.every((event) => new Date(event.iniciaEn).getTime() > now.getTime()));
});

test('el pick principal toma el evento futuro más próximo, no un template', () => {
  const now = new Date('2026-09-08T16:00:00.000Z');
  const snapshot = calendarioConAgenda(vacio, now);
  const event = eventoChallenge(snapshot, now.getTime());
  const challenge = challengeDesdeCalendario(snapshot);

  assert.equal(event?.id, 'demo-mlb-futuro');
  assert.equal(event?.local.nombre, 'Yankees');
  assert.equal(challenge?.local.nombre, 'Yankees');
  assert.notEqual(challenge?.local.nombre, 'Dodgers');
});

test('respeta eventos reales sincronizados', () => {
  const now = Date.now();
  const snapshot: CalendarioDeportivo = {
    ...vacio,
    eventos: [
      ...eventosDemo(new Date(now)),
      {
        id: 'real-proximo',
        liga: 'NBA',
        competicion: 'NBA',
        temporada: '2026',
        iniciaEn: new Date(now + 60 * 60 * 1000).toISOString(),
        estado: 'PROGRAMADO',
        estadoDetalle: 'Programado',
        local: { id: 'mia', nombre: 'Heat', codigo: 'MIA' },
        visitante: { id: 'bos', nombre: 'Celtics', codigo: 'BOS' },
      },
    ],
  };

  assert.equal(calendarioConAgenda(snapshot).eventos.length, snapshot.eventos.length);
  assert.equal(eventoChallenge(snapshot, now)?.id, 'real-proximo');
});
