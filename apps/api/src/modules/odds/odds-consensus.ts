import type {
  CuotaCasaApuesta,
  MercadoMoneyline,
  MercadoSpread,
  MercadoTotal,
} from '@pickbros/types';
import {
  averageProbability,
  probabilityToAmericanOdds,
} from './odds-math';

function consensusAmerican(oddsList: number[]): number | undefined {
  const probability = averageProbability(oddsList);
  if (probability === undefined) return undefined;
  return probabilityToAmericanOdds(probability);
}

function modalValue(values: number[]): number | undefined {
  if (!values.length) return undefined;

  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0];
}

export function calculateConsensusOdds(bookmakers: CuotaCasaApuesta[]): {
  moneyline?: MercadoMoneyline;
  spread?: MercadoSpread;
  total?: MercadoTotal;
} {
  const homeMoneyline = consensusAmerican(
    bookmakers.flatMap((book) =>
      book.moneyline?.home === undefined ? [] : [book.moneyline.home],
    ),
  );
  const awayMoneyline = consensusAmerican(
    bookmakers.flatMap((book) =>
      book.moneyline?.away === undefined ? [] : [book.moneyline.away],
    ),
  );
  const drawMoneyline = consensusAmerican(
    bookmakers.flatMap((book) =>
      book.moneyline?.draw === undefined ? [] : [book.moneyline.draw],
    ),
  );

  const homeLines = bookmakers.flatMap((book) =>
    book.spread?.home ? [book.spread.home.line] : [],
  );
  const awayLines = bookmakers.flatMap((book) =>
    book.spread?.away ? [book.spread.away.line] : [],
  );
  const homeLine = modalValue(homeLines);
  const awayLine = modalValue(awayLines);

  const homeSpreadOdds = consensusAmerican(
    bookmakers.flatMap((book) =>
      book.spread?.home && book.spread.home.line === homeLine
        ? [book.spread.home.odds]
        : [],
    ),
  );
  const awaySpreadOdds = consensusAmerican(
    bookmakers.flatMap((book) =>
      book.spread?.away && book.spread.away.line === awayLine
        ? [book.spread.away.odds]
        : [],
    ),
  );

  const totalLines = bookmakers.flatMap((book) =>
    book.total ? [book.total.line] : [],
  );
  const totalLine = modalValue(totalLines);
  const overOdds = consensusAmerican(
    bookmakers.flatMap((book) =>
      book.total && book.total.line === totalLine && book.total.over !== undefined
        ? [book.total.over]
        : [],
    ),
  );
  const underOdds = consensusAmerican(
    bookmakers.flatMap((book) =>
      book.total &&
      book.total.line === totalLine &&
      book.total.under !== undefined
        ? [book.total.under]
        : [],
    ),
  );

  return {
    ...(homeMoneyline !== undefined ||
    awayMoneyline !== undefined ||
    drawMoneyline !== undefined
      ? {
          moneyline: {
            ...(homeMoneyline !== undefined ? { home: homeMoneyline } : {}),
            ...(awayMoneyline !== undefined ? { away: awayMoneyline } : {}),
            ...(drawMoneyline !== undefined ? { draw: drawMoneyline } : {}),
          },
        }
      : {}),
    ...(homeLine !== undefined && homeSpreadOdds !== undefined
      ? {
          spread: {
            home: { line: homeLine, odds: homeSpreadOdds },
            ...(awayLine !== undefined && awaySpreadOdds !== undefined
              ? { away: { line: awayLine, odds: awaySpreadOdds } }
              : {}),
          },
        }
      : awayLine !== undefined && awaySpreadOdds !== undefined
        ? {
            spread: {
              away: { line: awayLine, odds: awaySpreadOdds },
            },
          }
        : {}),
    ...(totalLine !== undefined && (overOdds !== undefined || underOdds !== undefined)
      ? {
          total: {
            line: totalLine,
            ...(overOdds !== undefined ? { over: overOdds } : {}),
            ...(underOdds !== undefined ? { under: underOdds } : {}),
          },
        }
      : {}),
  };
}
