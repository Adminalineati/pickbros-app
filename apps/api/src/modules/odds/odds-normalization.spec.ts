import { normalizeOddsEvent } from './odds-normalization';
import type { TheOddsApiEvent } from '../../integrations/the-odds-api/the-odds-api.types';

const raw: TheOddsApiEvent = {
  id: 'odds-abc',
  sport_key: 'americanfootball_nfl',
  commence_time: '2026-09-13T00:20:00.000Z',
  home_team: 'Kansas City Chiefs',
  away_team: 'Buffalo Bills',
  bookmakers: [
    {
      key: 'fanduel',
      title: 'FanDuel',
      last_update: '2026-09-12T10:00:00.000Z',
      markets: [
        {
          key: 'h2h',
          outcomes: [
            { name: 'Kansas City Chiefs', price: -250 },
            { name: 'Buffalo Bills', price: 210 },
          ],
        },
        {
          key: 'spreads',
          outcomes: [
            { name: 'Kansas City Chiefs', price: -110, point: -5.5 },
            { name: 'Buffalo Bills', price: -110, point: 5.5 },
          ],
        },
        {
          key: 'totals',
          outcomes: [
            { name: 'Over', price: -110, point: 47.5 },
            { name: 'Under', price: -110, point: 47.5 },
          ],
        },
      ],
    },
  ],
};

describe('normalizeOddsEvent', () => {
  it('produce el contrato interno, no el payload crudo', () => {
    const event = normalizeOddsEvent(raw, 'NFL', 'highlightly:nfl:99');

    expect(event.eventId).toBe('highlightly:nfl:99');
    expect(event.providerEventId).toBe('odds-abc');
    expect(event.matched).toBe(true);
    expect(event.source).toBe('the-odds-api');
    expect(event.homeTeam).toMatchObject({
      nombre: 'Kansas City Chiefs',
      moneyline: -250,
      impliedProbability: 71.43,
      marketPosition: 'favorito',
    });
    expect(event.awayTeam).toMatchObject({
      nombre: 'Buffalo Bills',
      moneyline: 210,
      impliedProbability: 32.26,
      marketPosition: 'underdog',
    });
    expect(event.markets.spread?.home).toEqual({ line: -5.5, odds: -110 });
    expect(event.markets.total).toEqual({
      line: 47.5,
      over: -110,
      under: -110,
    });
    expect(event.favorite?.team).toBe('Kansas City Chiefs');
    expect(event.bookmakers?.[0]?.key).toBe('fanduel');
  });
});
