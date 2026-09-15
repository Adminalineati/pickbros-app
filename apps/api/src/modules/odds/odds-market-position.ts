import type { PosicionCuotaMercado, PosicionMercado } from '@pickbros/types';
import { impliedProbabilityPercent } from './odds-math';

const EVEN_TOLERANCE = 0.15;

export function detectarPosicionMercado(
  homeName: string,
  awayName: string,
  homeOdds?: number,
  awayOdds?: number,
): {
  home?: PosicionMercado;
  away?: PosicionMercado;
  favorite?: PosicionCuotaMercado;
  underdog?: PosicionCuotaMercado;
} {
  if (homeOdds === undefined || awayOdds === undefined) {
    return {};
  }

  const homeProbability = impliedProbabilityPercent(homeOdds);
  const awayProbability = impliedProbabilityPercent(awayOdds);

  if (Math.abs(homeProbability - awayProbability) <= EVEN_TOLERANCE) {
    return {
      home: 'even',
      away: 'even',
    };
  }

  const homeSide: PosicionCuotaMercado = {
    team: homeName,
    odds: homeOdds,
    impliedProbability: homeProbability,
  };
  const awaySide: PosicionCuotaMercado = {
    team: awayName,
    odds: awayOdds,
    impliedProbability: awayProbability,
  };

  if (homeProbability > awayProbability) {
    return {
      home: 'favorito',
      away: 'underdog',
      favorite: homeSide,
      underdog: awaySide,
    };
  }

  return {
    home: 'underdog',
    away: 'favorito',
    favorite: awaySide,
    underdog: homeSide,
  };
}
