import type { LigaDeportiva } from '@pickbros/types';

export const ODDS_SPORT_KEYS = {
  NFL: 'americanfootball_nfl',
  NBA: 'basketball_nba',
  MLB: 'baseball_mlb',
  Champions: 'soccer_uefa_champs_league',
} as const satisfies Record<LigaDeportiva, string>;

const ALIASES: Record<string, LigaDeportiva> = {
  nfl: 'NFL',
  nba: 'NBA',
  mlb: 'MLB',
  champions: 'Champions',
  ucl: 'Champions',
  soccer: 'Champions',
  football: 'Champions',
};

export function parseLiga(value: string): LigaDeportiva | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized in ALIASES) {
    return ALIASES[normalized];
  }

  const exact = (['NFL', 'NBA', 'MLB', 'Champions'] as const).find(
    (liga) => liga.toLowerCase() === normalized,
  );
  return exact;
}

export function sportKeyFor(liga: LigaDeportiva): string {
  return ODDS_SPORT_KEYS[liga];
}
