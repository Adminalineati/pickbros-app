import { calculateConsensusOdds } from './odds-consensus';

describe('calculateConsensusOdds', () => {
  it('promedia probabilidades, no american odds', () => {
    const consensus = calculateConsensusOdds([
      {
        key: 'fanduel',
        title: 'FanDuel',
        lastUpdated: '2026-09-12T00:00:00.000Z',
        moneyline: { home: -205, away: 175 },
      },
      {
        key: 'draftkings',
        title: 'DraftKings',
        lastUpdated: '2026-09-12T00:00:00.000Z',
        moneyline: { home: -210, away: 180 },
      },
      {
        key: 'betmgm',
        title: 'BetMGM',
        lastUpdated: '2026-09-12T00:00:00.000Z',
        moneyline: { home: -200, away: 170 },
      },
      {
        key: 'caesars',
        title: 'Caesars',
        lastUpdated: '2026-09-12T00:00:00.000Z',
        moneyline: { home: -215, away: 185 },
      },
    ]);

    expect(consensus.moneyline?.home).toBeLessThan(-200);
    expect(consensus.moneyline?.home).toBeGreaterThan(-220);
    expect(consensus.moneyline?.away).toBeGreaterThan(170);
    expect(consensus.moneyline?.away).toBeLessThan(190);
  });

  it('usa la línea modal en spreads y totals', () => {
    const consensus = calculateConsensusOdds([
      {
        key: 'a',
        title: 'A',
        lastUpdated: '2026-09-12T00:00:00.000Z',
        spread: {
          home: { line: -5.5, odds: -110 },
          away: { line: 5.5, odds: -110 },
        },
        total: { line: 47.5, over: -110, under: -110 },
      },
      {
        key: 'b',
        title: 'B',
        lastUpdated: '2026-09-12T00:00:00.000Z',
        spread: {
          home: { line: -5.5, odds: -105 },
          away: { line: 5.5, odds: -115 },
        },
        total: { line: 47.5, over: -108, under: -112 },
      },
      {
        key: 'c',
        title: 'C',
        lastUpdated: '2026-09-12T00:00:00.000Z',
        spread: {
          home: { line: -6, odds: -110 },
          away: { line: 6, odds: -110 },
        },
        total: { line: 48, over: -110, under: -110 },
      },
    ]);

    expect(consensus.spread?.home?.line).toBe(-5.5);
    expect(consensus.spread?.away?.line).toBe(5.5);
    expect(consensus.total?.line).toBe(47.5);
  });
});
