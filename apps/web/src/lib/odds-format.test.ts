import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  formatearAmerican,
  formatearLinea,
  formatearProbabilidadImplicita,
} from './odds-format';

test('formatea american odds con signo', () => {
  assert.equal(formatearAmerican(-250), '-250');
  assert.equal(formatearAmerican(210), '+210');
  assert.equal(formatearAmerican(100), '+100');
});

test('formatea líneas y probabilidad implícita', () => {
  assert.equal(formatearLinea(-5.5), '-5.5');
  assert.equal(formatearLinea(5.5), '+5.5');
  assert.equal(formatearProbabilidadImplicita(71.43), '71.4%');
});
