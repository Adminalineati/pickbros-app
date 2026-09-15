import { matchSportsEvents } from './odds-matching';
import { namesMatch, normalizeTeamName } from './odds-names';

describe('normalizeTeamName', () => {
  it('limpia mayúsculas, espacios y acentos', () => {
    expect(normalizeTeamName('  Bayern München  ')).toBe('bayern munchen');
  });
});

describe('namesMatch', () => {
  it('iguala nombre largo y apodo', () => {
    expect(namesMatch('Kansas City Chiefs', 'Chiefs')).toBe(true);
    expect(namesMatch('Kansas City Chiefs', 'Kansas City Chiefs')).toBe(true);
    expect(namesMatch('Buffalo Bills', 'Bills')).toBe(true);
    expect(namesMatch('Real Madrid CF', 'Real Madrid')).toBe(true);
  });

  it('no inventa un rival distinto', () => {
    expect(namesMatch('Kansas City Chiefs', 'Buffalo Bills')).toBe(false);
    expect(namesMatch('Manchester City', 'Manchester United')).toBe(false);
  });
});

describe('matchSportsEvents', () => {
  const chiefsBills = {
    providerEventId: 'odds-1',
    sport: 'NFL' as const,
    homeName: 'Kansas City Chiefs',
    awayName: 'Buffalo Bills',
    commenceTime: '2026-09-13T00:20:00.000Z',
  };

  it('asocia por sport, equipos y hora', () => {
    const result = matchSportsEvents(
      [
        {
          id: 'highlightly:nfl:99',
          liga: 'NFL',
          localNombre: 'Chiefs',
          visitanteNombre: 'Bills',
          iniciaEn: '2026-09-13T00:25:00.000Z',
        },
      ],
      [chiefsBills],
    );

    expect(result.matches).toEqual([
      {
        highlightlyEventId: 'highlightly:nfl:99',
        providerEventId: 'odds-1',
        confidence: 'high',
        swappedHomeAway: false,
      },
    ]);
    expect(result.unmatched).toEqual([]);
  });

  it('no inventa match si el rival o el deporte no coinciden', () => {
    const result = matchSportsEvents(
      [
        {
          id: 'highlightly:nfl:1',
          liga: 'NFL',
          localNombre: 'Chiefs',
          visitanteNombre: 'Bengals',
          iniciaEn: '2026-09-13T00:20:00.000Z',
        },
        {
          id: 'highlightly:nba:1',
          liga: 'NBA',
          localNombre: 'Kansas City Chiefs',
          visitanteNombre: 'Buffalo Bills',
          iniciaEn: '2026-09-13T00:20:00.000Z',
        },
      ],
      [chiefsBills],
    );

    expect(result.matches).toEqual([]);
    expect(result.unmatched).toEqual(['highlightly:nfl:1', 'highlightly:nba:1']);
  });
});
