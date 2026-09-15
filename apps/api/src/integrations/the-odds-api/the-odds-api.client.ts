import { Injectable, Logger } from '@nestjs/common';
import { oddsConfig } from '../../modules/odds/odds.config';
import type {
  TheOddsApiError,
  TheOddsApiEvent,
  TheOddsApiSport,
  TheOddsApiUsage,
} from './the-odds-api.types';

export interface OddsFetchResult<T> {
  data: T;
  usage: TheOddsApiUsage;
}

@Injectable()
export class TheOddsApiClient {
  private readonly logger = new Logger('ODDS_API');

  async listSports(): Promise<OddsFetchResult<TheOddsApiSport[]>> {
    return this.get<TheOddsApiSport[]>('/v4/sports', { all: 'true' });
  }

  async listOdds(input: {
    sportKey: string;
    markets: string[];
    region: string;
    bookmakers?: string[];
  }): Promise<OddsFetchResult<TheOddsApiEvent[]>> {
    const params: Record<string, string> = {
      markets: input.markets.join(','),
      oddsFormat: 'american',
      dateFormat: 'iso',
    };

    if (input.bookmakers?.length) {
      params.bookmakers = input.bookmakers.join(',');
    } else {
      params.regions = input.region;
    }

    return this.get<TheOddsApiEvent[]>(
      `/v4/sports/${encodeURIComponent(input.sportKey)}/odds`,
      params,
    );
  }

  private async get<T>(
    path: string,
    params: Record<string, string>,
  ): Promise<OddsFetchResult<T>> {
    const config = oddsConfig();
    if (!config.apiKey) {
      throw this.error('Falta THE_ODDS_API_KEY', 401, 'unauthorized');
    }

    const url = new URL(path, config.baseUrl);
    url.searchParams.set('apiKey', config.apiKey);
    for (const [name, value] of Object.entries(params)) {
      url.searchParams.set(name, value);
    }

    const started = Date.now();
    let response: Response;

    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(config.timeoutMs),
      });
    } catch (cause) {
      const timedOut =
        cause instanceof Error &&
        (cause.name === 'TimeoutError' || cause.name === 'AbortError');
      throw this.error(
        timedOut ? 'Timeout al consultar The Odds API' : 'Error de red The Odds API',
        timedOut ? 504 : 502,
        timedOut ? 'timeout' : 'network',
      );
    }

    const usage = this.readUsage(response);
    this.logger.log(
      `path=${path} status=${response.status} duration=${Date.now() - started} remaining=${usage.remaining ?? '-'} used=${usage.used ?? '-'} last_cost=${usage.last ?? '-'}`,
    );

    if (!response.ok) {
      throw this.error(
        `The Odds API respondió ${response.status}`,
        response.status,
        this.codeForStatus(response.status),
      );
    }

    const data = (await response.json()) as T;
    return { data, usage };
  }

  private readUsage(response: Response): TheOddsApiUsage {
    const remaining = response.headers.get('x-requests-remaining');
    const used = response.headers.get('x-requests-used');
    const last = response.headers.get('x-requests-last');

    return {
      remaining: remaining ? Number(remaining) : undefined,
      used: used ? Number(used) : undefined,
      last: last ? Number(last) : undefined,
    };
  }

  private codeForStatus(status: number): TheOddsApiError['code'] {
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not_found';
    if (status === 422) return 'unprocessable';
    if (status === 429) return 'rate_limited';
    return 'upstream';
  }

  private error(
    message: string,
    status: number,
    code: TheOddsApiError['code'],
  ): TheOddsApiError {
    const error = new Error(message) as TheOddsApiError;
    error.status = status;
    error.code = code;
    return error;
  }
}
