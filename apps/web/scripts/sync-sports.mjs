import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sincronizarDeportes } from './api-sports.mjs';

function argumento(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function leerAnterior(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return undefined;
  }
}

const output = resolve(argumento('--output', 'public/data/sports.json'));
const previousPath = resolve(argumento('--previous', output));
const nowValue = argumento('--now');

const snapshot = await sincronizarDeportes({
  key: process.env.API_SPORTS_KEY,
  zonaHoraria: process.env.API_SPORTS_TIMEZONE ?? 'America/Mexico_City',
  now: nowValue ? new Date(nowValue) : new Date(),
  anterior: await leerAnterior(previousPath),
});

await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

const ok = snapshot.fuentes.filter((source) => source.ok).length;
console.log(
  `API-Sports: ${snapshot.eventos.length} eventos, ${ok}/${snapshot.fuentes.length} fuentes correctas.`,
);
