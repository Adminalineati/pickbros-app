export function formatearAmerican(odds: number): string {
  if (!Number.isFinite(odds)) return '—';
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function formatearLinea(line: number): string {
  if (!Number.isFinite(line)) return '—';
  return line > 0 ? `+${line}` : `${line}`;
}

export function formatearProbabilidadImplicita(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(1)}%`;
}
