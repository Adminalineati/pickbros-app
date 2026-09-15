import {
  americanOddsToProbability,
  impliedProbabilityPercent,
  probabilityToAmericanOdds,
} from './odds-math';

describe('americanOddsToProbability', () => {
  it('convierte favorites y underdogs americanos', () => {
    expect(americanOddsToProbability(-250)).toBeCloseTo(0.7142857, 6);
    expect(americanOddsToProbability(-200)).toBeCloseTo(2 / 3, 6);
    expect(americanOddsToProbability(-110)).toBeCloseTo(110 / 210, 6);
    expect(americanOddsToProbability(100)).toBeCloseTo(0.5, 6);
    expect(americanOddsToProbability(150)).toBeCloseTo(0.4, 6);
    expect(americanOddsToProbability(300)).toBeCloseTo(0.25, 6);
  });

  it('expone el porcentaje usado en UI', () => {
    expect(impliedProbabilityPercent(-250)).toBe(71.43);
    expect(impliedProbabilityPercent(210)).toBe(32.26);
  });
});

describe('probabilityToAmericanOdds', () => {
  it('regresa a american odds redondeados', () => {
    expect(probabilityToAmericanOdds(0.5)).toBe(100);
    expect(probabilityToAmericanOdds(0.714285714)).toBe(-250);
    expect(probabilityToAmericanOdds(0.4)).toBe(150);
    expect(probabilityToAmericanOdds(0.25)).toBe(300);
  });
});
