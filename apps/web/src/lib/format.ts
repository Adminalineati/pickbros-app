export function formatearNumero(valor: number): string {
  return new Intl.NumberFormat('es-MX').format(valor);
}
