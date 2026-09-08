import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ESTADOS_POR_PAIS, PAISES, estadosDe } from './locations';

test('todos los países de registro tienen lista de estados', () => {
  for (const pais of PAISES) {
    const estados = estadosDe(pais.codigo);
    assert.ok(estados.length > 0, `${pais.nombre} no tiene estados`);
  }
});

test('México incluye Jalisco y Ciudad de México', () => {
  assert.ok(ESTADOS_POR_PAIS.MX.includes('Jalisco'));
  assert.ok(ESTADOS_POR_PAIS.MX.includes('Ciudad de México'));
});
