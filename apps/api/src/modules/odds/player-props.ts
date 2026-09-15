import type { LigaDeportiva } from '@pickbros/types';

/**
 * Markets oficiales de The Odds API para player props.
 * No se consultan en esta fase: solo se piden al abrir el detalle de un evento.
 * @see https://the-odds-api.com/sports-odds-data/betting-markets.html
 */
export const PLAYER_PROP_MARKETS = {
  NFL: [
    'player_pass_yds',
    'player_rush_yds',
    'player_reception_yds',
    'player_pass_tds',
    'player_pass_interceptions',
  ],
  NBA: [
    'player_points',
    'player_assists',
    'player_rebounds',
    'player_threes',
    'player_points_rebounds_assists',
  ],
  MLB: ['pitcher_strikeouts', 'batter_hits', 'batter_home_runs'],
  Champions: [],
} as const satisfies Record<LigaDeportiva, readonly string[]>;

export const FUTURE_EVENT_MARKETS = [
  'alternate_spreads',
  'alternate_totals',
] as const;

export interface PlayerPropOutcome {
  player: string;
  name: string;
  point?: number;
  odds: number;
}

export interface PlayerPropMarket {
  key: string;
  lastUpdated?: string;
  outcomes: PlayerPropOutcome[];
}

export interface EventoPlayerProps {
  eventId: string;
  providerEventId: string;
  sport: LigaDeportiva;
  markets: PlayerPropMarket[];
  available: boolean;
}
