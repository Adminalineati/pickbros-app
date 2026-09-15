import type {
  CuotaCasaApuesta,
  EventoCuotas,
  LigaDeportiva,
  MercadoMoneyline,
  MercadoSpread,
  MercadoTotal,
} from '@pickbros/types';
import type {
  TheOddsApiBookmaker,
  TheOddsApiEvent,
  TheOddsApiMarket,
} from '../../integrations/the-odds-api/the-odds-api.types';
import { calculateConsensusOdds } from './odds-consensus';
import { impliedProbabilityPercent } from './odds-math';
import { detectarPosicionMercado } from './odds-market-position';

function outcomePrice(market: TheOddsApiMarket | undefined, name: string) {
  const outcome = market?.outcomes.find(
    (item) => item.name.toLowerCase() === name.toLowerCase(),
  );
  return outcome && Number.isFinite(outcome.price) ? outcome.price : undefined;
}

function outcomeLine(market: TheOddsApiMarket | undefined, name: string) {
  return market?.outcomes.find(
    (item) => item.name.toLowerCase() === name.toLowerCase(),
  )?.point;
}

function moneylineFrom(market: TheOddsApiMarket | undefined, event: TheOddsApiEvent) {
  if (!market) return undefined;
  const moneyline: MercadoMoneyline = {
    home: outcomePrice(market, event.home_team),
    away: outcomePrice(market, event.away_team),
    draw: outcomePrice(market, 'Draw'),
  };
  if (
    moneyline.home === undefined &&
    moneyline.away === undefined &&
    moneyline.draw === undefined
  ) {
    return undefined;
  }
  return moneyline;
}

function spreadFrom(market: TheOddsApiMarket | undefined, event: TheOddsApiEvent) {
  if (!market) return undefined;
  const homeLine = outcomeLine(market, event.home_team);
  const awayLine = outcomeLine(market, event.away_team);
  const homeOdds = outcomePrice(market, event.home_team);
  const awayOdds = outcomePrice(market, event.away_team);
  const spread: MercadoSpread = {
    ...(homeLine !== undefined && homeOdds !== undefined
      ? { home: { line: homeLine, odds: homeOdds } }
      : {}),
    ...(awayLine !== undefined && awayOdds !== undefined
      ? { away: { line: awayLine, odds: awayOdds } }
      : {}),
  };
  return spread.home || spread.away ? spread : undefined;
}

function totalFrom(market: TheOddsApiMarket | undefined) {
  if (!market) return undefined;
  const over = market.outcomes.find((item) => item.name.toLowerCase() === 'over');
  const under = market.outcomes.find((item) => item.name.toLowerCase() === 'under');
  const line = over?.point ?? under?.point;
  if (line === undefined) return undefined;
  const total: MercadoTotal = {
    line,
    ...(over && Number.isFinite(over.price) ? { over: over.price } : {}),
    ...(under && Number.isFinite(under.price) ? { under: under.price } : {}),
  };
  return total;
}

function marketsOf(bookmaker: TheOddsApiBookmaker, key: string) {
  return bookmaker.markets.find((market) => market.key === key);
}

export function normalizeBookmaker(
  bookmaker: TheOddsApiBookmaker,
  event: TheOddsApiEvent,
): CuotaCasaApuesta {
  return {
    key: bookmaker.key,
    title: bookmaker.title,
    lastUpdated: bookmaker.last_update ?? new Date().toISOString(),
    moneyline: moneylineFrom(marketsOf(bookmaker, 'h2h'), event),
    spread: spreadFrom(marketsOf(bookmaker, 'spreads'), event),
    total: totalFrom(marketsOf(bookmaker, 'totals')),
  };
}

export function normalizeOddsEvent(
  event: TheOddsApiEvent,
  liga: LigaDeportiva,
  highlightlyEventId?: string,
): EventoCuotas {
  const bookmakers = (event.bookmakers ?? []).map((bookmaker) =>
    normalizeBookmaker(bookmaker, event),
  );
  const consensus = calculateConsensusOdds(bookmakers);
  const position = detectarPosicionMercado(
    event.home_team,
    event.away_team,
    consensus.moneyline?.home,
    consensus.moneyline?.away,
  );
  const lastUpdated =
    bookmakers
      .map((bookmaker) => bookmaker.lastUpdated)
      .sort()
      .at(-1) ?? new Date().toISOString();

  return {
    eventId: highlightlyEventId ?? event.id,
    providerEventId: event.id,
    sport: liga,
    matched: Boolean(highlightlyEventId),
    available: Boolean(
      consensus.moneyline || consensus.spread || consensus.total,
    ),
    homeTeam: {
      nombre: event.home_team,
      moneyline: consensus.moneyline?.home,
      impliedProbability:
        consensus.moneyline?.home !== undefined
          ? impliedProbabilityPercent(consensus.moneyline.home)
          : undefined,
      marketPosition: position.home,
    },
    awayTeam: {
      nombre: event.away_team,
      moneyline: consensus.moneyline?.away,
      impliedProbability:
        consensus.moneyline?.away !== undefined
          ? impliedProbabilityPercent(consensus.moneyline.away)
          : undefined,
      marketPosition: position.away,
    },
    commenceTime: event.commence_time,
    markets: {
      moneyline: consensus.moneyline,
      spread: consensus.spread,
      total: consensus.total,
    },
    favorite: position.favorite,
    underdog: position.underdog,
    bookmakers,
    lastUpdated,
    source: 'the-odds-api',
  };
}

export function eventoCuotasNoDisponible(input: {
  eventId: string;
  sport: LigaDeportiva;
  homeName: string;
  awayName: string;
  commenceTime: string;
}): EventoCuotas {
  return {
    eventId: input.eventId,
    sport: input.sport,
    matched: false,
    available: false,
    homeTeam: { nombre: input.homeName },
    awayTeam: { nombre: input.awayName },
    commenceTime: input.commenceTime,
    markets: {},
    lastUpdated: new Date().toISOString(),
    source: 'the-odds-api',
  };
}
