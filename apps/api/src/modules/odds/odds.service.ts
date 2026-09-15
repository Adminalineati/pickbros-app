import { Injectable, Logger } from '@nestjs/common';
import type {
  CuotasAsociadasRespuesta,
  CuotasLigaRespuesta,
  EventoCuotas,
  EventoParaAsociarCuotas,
  LigaDeportiva,
} from '@pickbros/types';
import { TheOddsApiClient } from '../../integrations/the-odds-api/the-odds-api.client';
import type { TheOddsApiError, TheOddsApiEvent } from '../../integrations/the-odds-api/the-odds-api.types';
import { OddsCacheService } from './odds-cache.service';
import { oddsConfig } from './odds.config';
import {
  matchSportsEvent,
  matchSportsEvents,
  type EventoOddsComparable,
} from './odds-matching';
import {
  eventoCuotasNoDisponible,
  normalizeOddsEvent,
} from './odds-normalization';
import { sportKeyFor } from './odds-sports';

interface CachedLeagueOdds {
  events: TheOddsApiEvent[];
  fetchedAt: string;
}

@Injectable()
export class OddsService {
  private readonly logger = new Logger('ODDS_API');

  constructor(
    private readonly client: TheOddsApiClient,
    private readonly cache: OddsCacheService,
  ) {}

  async listarPorLiga(
    liga: LigaDeportiva,
    markets?: string[],
  ): Promise<CuotasLigaRespuesta> {
    const started = Date.now();
    const result = await this.cargarLiga(liga, markets);

    this.logUsage({
      sport: liga,
      eventsReceived: result.events.length,
      matches: 0,
      unmatched: result.events.length,
      cacheHit: result.cacheHit,
      duration: Date.now() - started,
    });

    return {
      liga,
      sportKey: sportKeyFor(liga),
      available: result.available,
      reason: result.reason,
      events: result.events.map((event) => normalizeOddsEvent(event, liga)),
      unmatched: result.events.length,
      cacheHit: result.cacheHit,
      lastUpdated: result.fetchedAt,
    };
  }

  async cuotasDeEvento(input: EventoParaAsociarCuotas): Promise<EventoCuotas> {
    const started = Date.now();
    const result = await this.cargarLiga(input.liga);

    if (!result.available) {
      return eventoCuotasNoDisponible({
        eventId: input.id,
        sport: input.liga,
        homeName: input.localNombre,
        awayName: input.visitanteNombre,
        commenceTime: input.iniciaEn,
      });
    }

    const match = matchSportsEvent(input, this.comparables(result.events, input.liga));
    const raw = match
      ? result.events.find((event) => event.id === match.providerEventId)
      : undefined;

    if (!match || !raw) {
      this.logger.warn(
        `unmatched eventId=${input.id} liga=${input.liga} local="${input.localNombre}" visitante="${input.visitanteNombre}"`,
      );
      this.logUsage({
        sport: input.liga,
        eventsReceived: result.events.length,
        matches: 0,
        unmatched: 1,
        cacheHit: result.cacheHit,
        duration: Date.now() - started,
      });
      return eventoCuotasNoDisponible({
        eventId: input.id,
        sport: input.liga,
        homeName: input.localNombre,
        awayName: input.visitanteNombre,
        commenceTime: input.iniciaEn,
      });
    }

    this.logUsage({
      sport: input.liga,
      eventsReceived: result.events.length,
      matches: 1,
      unmatched: 0,
      cacheHit: result.cacheHit,
      duration: Date.now() - started,
    });

    return normalizeOddsEvent(raw, input.liga, input.id);
  }

  async asociar(
    eventos: EventoParaAsociarCuotas[],
  ): Promise<CuotasAsociadasRespuesta> {
    const started = Date.now();
    const byLiga = new Map<LigaDeportiva, EventoParaAsociarCuotas[]>();
    for (const event of eventos) {
      byLiga.set(event.liga, [...(byLiga.get(event.liga) ?? []), event]);
    }

    const asociated: Record<string, EventoCuotas> = {};
    const unmatched: string[] = [];
    let cacheHit = true;
    let available = false;
    let reason: string | undefined;
    let lastUpdated = new Date().toISOString();

    for (const [liga, group] of byLiga) {
      const result = await this.cargarLiga(liga);
      cacheHit = cacheHit && result.cacheHit;
      lastUpdated = result.fetchedAt;
      if (!result.available) {
        reason = result.reason;
        for (const event of group) {
          unmatched.push(event.id);
          asociated[event.id] = eventoCuotasNoDisponible({
            eventId: event.id,
            sport: event.liga,
            homeName: event.localNombre,
            awayName: event.visitanteNombre,
            commenceTime: event.iniciaEn,
          });
        }
        continue;
      }

      available = true;
      const matched = matchSportsEvents(
        group,
        this.comparables(result.events, liga),
      );

      unmatched.push(...matched.unmatched);
      for (const id of matched.unmatched) {
        const event = group.find((item) => item.id === id);
        if (!event) continue;
        this.logger.warn(
          `unmatched eventId=${event.id} liga=${event.liga} local="${event.localNombre}" visitante="${event.visitanteNombre}"`,
        );
        asociated[id] = eventoCuotasNoDisponible({
          eventId: event.id,
          sport: event.liga,
          homeName: event.localNombre,
          awayName: event.visitanteNombre,
          commenceTime: event.iniciaEn,
        });
      }

      for (const match of matched.matches) {
        const raw = result.events.find(
          (event) => event.id === match.providerEventId,
        );
        const event = group.find((item) => item.id === match.highlightlyEventId);
        if (!raw || !event) continue;
        asociated[event.id] = normalizeOddsEvent(raw, liga, event.id);
      }

      this.logUsage({
        sport: liga,
        eventsReceived: result.events.length,
        matches: matched.matches.length,
        unmatched: matched.unmatched.length,
        cacheHit: result.cacheHit,
        duration: Date.now() - started,
      });
    }

    return {
      available,
      reason,
      cacheHit,
      eventos: asociated,
      unmatched,
      lastUpdated,
    };
  }

  private comparables(
    events: TheOddsApiEvent[],
    liga: LigaDeportiva,
  ): EventoOddsComparable[] {
    return events.map((event) => ({
      providerEventId: event.id,
      sport: liga,
      homeName: event.home_team,
      awayName: event.away_team,
      commenceTime: event.commence_time,
    }));
  }

  private async cargarLiga(liga: LigaDeportiva, marketsOverride?: string[]) {
    const config = oddsConfig();
    const markets = marketsOverride?.length ? marketsOverride : config.markets;
    const sportKey = sportKeyFor(liga);
    const cacheKey = [
      'odds',
      sportKey,
      markets.join(','),
      config.region,
      config.bookmakers.join(','),
      'american',
    ].join(':');

    if (!config.apiKey) {
      return {
        events: [] as TheOddsApiEvent[],
        fetchedAt: new Date().toISOString(),
        cacheHit: false,
        available: false,
        reason: 'THE_ODDS_API_KEY no configurada',
      };
    }

    try {
      const { value, cacheHit } = await this.cache.getOrSet(
        cacheKey,
        (fetched) =>
          fetched.events.some(
            (event) => new Date(event.commence_time).getTime() <= Date.now(),
          )
            ? config.liveTtlSeconds
            : config.prematchTtlSeconds,
        async (): Promise<CachedLeagueOdds> => {
          const response = await this.client.listOdds({
            sportKey,
            markets,
            region: config.region,
            bookmakers: config.bookmakers,
          });
          return {
            events: response.data,
            fetchedAt: new Date().toISOString(),
          };
        },
      );

      return {
        events: value.events,
        fetchedAt: value.fetchedAt,
        cacheHit,
        available: true,
      };
    } catch (cause) {
      const error = cause as TheOddsApiError;
      this.logger.warn(
        `provider_error sport=${liga} code=${error.code ?? 'unknown'} status=${error.status ?? '-'} message=${error.message}`,
      );
      return {
        events: [] as TheOddsApiEvent[],
        fetchedAt: new Date().toISOString(),
        cacheHit: false,
        available: false,
        reason: 'Odds currently unavailable',
      };
    }
  }

  private logUsage(input: {
    sport: LigaDeportiva;
    eventsReceived: number;
    matches: number;
    unmatched: number;
    cacheHit: boolean;
    duration: number;
  }) {
    const config = oddsConfig();
    this.logger.log(
      `sport=${input.sport.toLowerCase()} markets=${config.markets.join(',')} events_received=${input.eventsReceived} highlightly_matches=${input.matches} unmatched=${input.unmatched} cache_hit=${input.cacheHit} duration=${input.duration}`,
    );
  }
}
