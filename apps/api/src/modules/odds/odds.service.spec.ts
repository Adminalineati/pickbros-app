import { OddsCacheService } from './odds-cache.service';
import { OddsService } from './odds.service';

describe('OddsService', () => {
  const previousKey = process.env.THE_ODDS_API_KEY;

  afterEach(() => {
    process.env.THE_ODDS_API_KEY = previousKey;
  });

  it('no rompe Highlightly si falta la llave: devuelve unavailable', async () => {
    delete process.env.THE_ODDS_API_KEY;
    const service = new OddsService(
      { listOdds: jest.fn() } as never,
      new OddsCacheService(),
    );

    const result = await service.listarPorLiga('NFL');
    expect(result.available).toBe(false);
    expect(result.events).toEqual([]);
  });

  it('si The Odds API falla, el calendario puede seguir sin cuotas', async () => {
    process.env.THE_ODDS_API_KEY = 'test-key';
    const service = new OddsService(
      {
        listOdds: jest.fn().mockRejectedValue(
          Object.assign(new Error('rate limited'), {
            status: 429,
            code: 'rate_limited',
          }),
        ),
      } as never,
      new OddsCacheService(),
    );

    const result = await service.cuotasDeEvento({
      id: 'highlightly:nfl:1',
      liga: 'NFL',
      localNombre: 'Chiefs',
      visitanteNombre: 'Bills',
      iniciaEn: '2026-09-13T00:20:00.000Z',
    });

    expect(result.available).toBe(false);
    expect(result.eventId).toBe('highlightly:nfl:1');
  });
});
