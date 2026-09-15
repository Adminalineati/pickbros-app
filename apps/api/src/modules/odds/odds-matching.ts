import type { LigaDeportiva } from '@pickbros/types';
import { namesMatch } from './odds-names';

export interface EventoComparable {
  id: string;
  liga: LigaDeportiva;
  localNombre: string;
  visitanteNombre: string;
  iniciaEn: string;
}

export interface EventoOddsComparable {
  providerEventId: string;
  sport: LigaDeportiva;
  homeName: string;
  awayName: string;
  commenceTime: string;
}

export interface ResultadoMatchEvento {
  highlightlyEventId: string;
  providerEventId: string;
  confidence: 'high' | 'medium';
  swappedHomeAway: boolean;
}

const DEFAULT_WINDOW_MS = 18 * 60 * 60 * 1000;
const SWAP_WINDOW_MS = 6 * 60 * 60 * 1000;

function timeDiffMs(left: string, right: string): number | undefined {
  const a = new Date(left).getTime();
  const b = new Date(right).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return undefined;
  return Math.abs(a - b);
}

export function matchSportsEvents(
  highlightlyEvents: EventoComparable[],
  oddsEvents: EventoOddsComparable[],
  windowMs = DEFAULT_WINDOW_MS,
): {
  matches: ResultadoMatchEvento[];
  unmatched: string[];
} {
  const usedOdds = new Set<string>();
  const matches: ResultadoMatchEvento[] = [];
  const unmatched: string[] = [];

  for (const event of highlightlyEvents) {
    const candidates = oddsEvents.filter((oddsEvent) => {
      if (usedOdds.has(oddsEvent.providerEventId)) return false;
      if (oddsEvent.sport !== event.liga) return false;
      const diff = timeDiffMs(event.iniciaEn, oddsEvent.commenceTime);
      return diff !== undefined && diff <= windowMs;
    });

    const direct = candidates.find(
      (oddsEvent) =>
        namesMatch(event.localNombre, oddsEvent.homeName) &&
        namesMatch(event.visitanteNombre, oddsEvent.awayName),
    );

    if (direct) {
      usedOdds.add(direct.providerEventId);
      matches.push({
        highlightlyEventId: event.id,
        providerEventId: direct.providerEventId,
        confidence: 'high',
        swappedHomeAway: false,
      });
      continue;
    }

    const swapped = candidates.find((oddsEvent) => {
      const diff = timeDiffMs(event.iniciaEn, oddsEvent.commenceTime);
      return (
        diff !== undefined &&
        diff <= SWAP_WINDOW_MS &&
        namesMatch(event.localNombre, oddsEvent.awayName) &&
        namesMatch(event.visitanteNombre, oddsEvent.homeName)
      );
    });

    if (swapped) {
      usedOdds.add(swapped.providerEventId);
      matches.push({
        highlightlyEventId: event.id,
        providerEventId: swapped.providerEventId,
        confidence: 'medium',
        swappedHomeAway: true,
      });
      continue;
    }

    unmatched.push(event.id);
  }

  return { matches, unmatched };
}

export function matchSportsEvent(
  event: EventoComparable,
  oddsEvents: EventoOddsComparable[],
  windowMs = DEFAULT_WINDOW_MS,
): ResultadoMatchEvento | undefined {
  return matchSportsEvents([event], oddsEvents, windowMs).matches[0];
}
