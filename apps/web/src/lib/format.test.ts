import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatearNumero } from './format';

test('formatea miles con locale es-MX', () => {
  assert.equal(formatearNumero(2450), '2,450');
});
