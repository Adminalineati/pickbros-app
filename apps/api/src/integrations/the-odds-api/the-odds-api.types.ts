export interface TheOddsApiSport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface TheOddsApiOutcome {
  name: string;
  price: number;
  point?: number;
  description?: string;
}

export interface TheOddsApiMarket {
  key: string;
  last_update?: string;
  outcomes: TheOddsApiOutcome[];
}

export interface TheOddsApiBookmaker {
  key: string;
  title: string;
  last_update?: string;
  markets: TheOddsApiMarket[];
}

export interface TheOddsApiEvent {
  id: string;
  sport_key: string;
  sport_title?: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: TheOddsApiBookmaker[];
}

export interface TheOddsApiUsage {
  remaining?: number;
  used?: number;
  last?: number;
}

export interface TheOddsApiError extends Error {
  status?: number;
  code?:
    | 'unauthorized'
    | 'forbidden'
    | 'not_found'
    | 'unprocessable'
    | 'rate_limited'
    | 'upstream'
    | 'timeout'
    | 'network';
}
