export function origenesCors(): string[] {
  return (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
}

export function puertoApi(): number {
  return Number(process.env.PORT ?? 3001);
}
