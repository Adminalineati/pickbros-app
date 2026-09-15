export function americanOddsToProbability(odds: number): number {
  if (!Number.isFinite(odds) || odds === 0) {
    throw new Error('American odds inválidos');
  }

  if (odds < 0) {
    const absolute = Math.abs(odds);
    return absolute / (absolute + 100);
  }

  return 100 / (odds + 100);
}

export function probabilityToAmericanOdds(probability: number): number {
  if (!Number.isFinite(probability) || probability <= 0 || probability >= 1) {
    throw new Error('Probabilidad inválida');
  }

  if (Math.abs(probability - 0.5) < 1e-9) {
    return 100;
  }

  if (probability > 0.5) {
    return Math.round((-100 * probability) / (1 - probability));
  }

  return Math.round((100 * (1 - probability)) / probability);
}

export function impliedProbabilityPercent(odds: number, decimals = 2): number {
  const value = americanOddsToProbability(odds) * 100;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function averageProbability(oddsList: number[]): number | undefined {
  const valid = oddsList.filter((odds) => Number.isFinite(odds) && odds !== 0);
  if (!valid.length) return undefined;

  const total = valid.reduce(
    (sum, odds) => sum + americanOddsToProbability(odds),
    0,
  );
  return total / valid.length;
}
