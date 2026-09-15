import { ODDS_SPORT_KEYS, parseLiga, sportKeyFor } from './odds-sports';

describe('odds sport keys', () => {
  it('usa las keys oficiales de The Odds API v4', () => {
    expect(ODDS_SPORT_KEYS).toEqual({
      NFL: 'americanfootball_nfl',
      NBA: 'basketball_nba',
      MLB: 'baseball_mlb',
      Champions: 'soccer_uefa_champs_league',
    });
    expect(sportKeyFor('NFL')).toBe('americanfootball_nfl');
  });

  it('acepta aliases de ruta', () => {
    expect(parseLiga('nfl')).toBe('NFL');
    expect(parseLiga('soccer')).toBe('Champions');
    expect(parseLiga('ucl')).toBe('Champions');
    expect(parseLiga('handball')).toBeUndefined();
  });
});
