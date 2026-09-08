import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BIRTHDATE_RANGE_MESSAGE,
  birthDateBounds,
  isEligibleBirthDate,
} from './birthdate';

const today = new Date(2026, 8, 8);

test('acepta 18 y 100 años cumplidos', () => {
  const { min, max } = birthDateBounds(today);
  assert.equal(isEligibleBirthDate(max, today), true);
  assert.equal(isEligibleBirthDate(min, today), true);
  assert.equal(isEligibleBirthDate('1990-01-01', today), true);
});

test('rechaza menores de 18 y mayores de 100', () => {
  assert.equal(isEligibleBirthDate('2010-09-08', today), false);
  assert.equal(isEligibleBirthDate('1925-09-07', today), false);
  assert.equal(isEligibleBirthDate('2026-09-08', today), false);
});

test('la leyenda explica la restricción de edad', () => {
  assert.match(BIRTHDATE_RANGE_MESSAGE, /menores de edad/);
});
