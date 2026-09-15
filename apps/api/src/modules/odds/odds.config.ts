const FEATURED_MARKETS = ['h2h', 'spreads', 'totals'] as const;

function numberEnv(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

function csvEnv(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (!raw?.trim()) return fallback;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function oddsConfig() {
  const markets = csvEnv('THE_ODDS_API_MARKETS', [...FEATURED_MARKETS]).filter(
    (market) =>
      (FEATURED_MARKETS as readonly string[]).includes(market) ||
      market === 'h2h',
  );

  return {
    apiKey: process.env.THE_ODDS_API_KEY?.trim() ?? '',
    baseUrl: 'https://api.the-odds-api.com',
    region: process.env.THE_ODDS_API_REGION?.trim() || 'us',
    markets: markets.length ? markets : [...FEATURED_MARKETS],
    bookmakers: csvEnv('THE_ODDS_API_BOOKMAKERS', []),
    prematchTtlSeconds: numberEnv('ODDS_PREMATCH_CACHE_TTL', 60),
    liveTtlSeconds: numberEnv('ODDS_LIVE_CACHE_TTL', 40),
    propsTtlSeconds: numberEnv('ODDS_PROPS_CACHE_TTL', 60),
    timeoutMs: 15_000,
  };
}

export type OddsConfig = ReturnType<typeof oddsConfig>;
