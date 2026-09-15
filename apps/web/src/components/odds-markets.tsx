import type { EventoCuotas, PosicionMercado } from '@pickbros/types';
import { OddsBadge } from '@/components/odds-badge';
import {
  formatearAmerican,
  formatearLinea,
  formatearProbabilidadImplicita,
} from '@/lib/odds-format';

const positionLabel: Record<PosicionMercado, string> = {
  favorito: 'Favorito',
  underdog: 'Underdog',
  even: 'Even',
};

function MarketPosition({ value }: { value?: PosicionMercado }) {
  if (!value) return null;
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-orange">
      {positionLabel[value]}
    </span>
  );
}

export function MoneylineMarket({
  odds,
  homeName,
  awayName,
}: {
  odds: EventoCuotas;
  homeName?: string;
  awayName?: string;
}) {
  const moneyline = odds.markets.moneyline;
  if (!moneyline) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <p className="truncate text-xs text-text-secondary">
          {homeName ?? odds.homeTeam.nombre}
        </p>
        <p className="font-display text-2xl text-text-primary">
          {moneyline.home !== undefined ? formatearAmerican(moneyline.home) : '—'}
        </p>
        {odds.homeTeam.impliedProbability !== undefined ? (
          <p className="text-[11px] text-text-secondary">
            {formatearProbabilidadImplicita(odds.homeTeam.impliedProbability)}{' '}
            probabilidad implícita del mercado
          </p>
        ) : null}
        <MarketPosition value={odds.homeTeam.marketPosition} />
      </div>
      <div className="sm:text-right">
        <p className="truncate text-xs text-text-secondary">
          {awayName ?? odds.awayTeam.nombre}
        </p>
        <p className="font-display text-2xl text-text-primary">
          {moneyline.away !== undefined ? formatearAmerican(moneyline.away) : '—'}
        </p>
        {odds.awayTeam.impliedProbability !== undefined ? (
          <p className="text-[11px] text-text-secondary">
            {formatearProbabilidadImplicita(odds.awayTeam.impliedProbability)}{' '}
            probabilidad implícita del mercado
          </p>
        ) : null}
        <MarketPosition value={odds.awayTeam.marketPosition} />
      </div>
      {moneyline.draw !== undefined ? (
        <p className="text-xs text-text-secondary sm:col-span-2 sm:text-center">
          Empate {formatearAmerican(moneyline.draw)}
        </p>
      ) : null}
    </div>
  );
}

export function SpreadMarket({ odds }: { odds: EventoCuotas }) {
  const spread = odds.markets.spread;
  if (!spread?.home && !spread?.away) return null;

  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {spread.home ? (
        <span className="rounded-lg border border-white/8 px-2 py-1">
          {odds.homeTeam.nombre.split(' ').at(-1)} {formatearLinea(spread.home.line)}{' '}
          <OddsBadge odds={spread.home.odds} />
        </span>
      ) : null}
      {spread.away ? (
        <span className="rounded-lg border border-white/8 px-2 py-1">
          {odds.awayTeam.nombre.split(' ').at(-1)} {formatearLinea(spread.away.line)}{' '}
          <OddsBadge odds={spread.away.odds} />
        </span>
      ) : null}
    </div>
  );
}

export function TotalsMarket({ odds }: { odds: EventoCuotas }) {
  const total = odds.markets.total;
  if (!total) return null;

  return (
    <div className="flex flex-wrap gap-3 text-xs">
      <span className="rounded-lg border border-white/8 px-2 py-1">
        O {total.line} <OddsBadge odds={total.over} />
      </span>
      <span className="rounded-lg border border-white/8 px-2 py-1">
        U {total.line} <OddsBadge odds={total.under} />
      </span>
    </div>
  );
}

export function BookmakerComparison({ odds }: { odds: EventoCuotas }) {
  if (!odds.bookmakers?.length) return null;

  return (
    <details className="text-xs text-text-secondary">
      <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wide">
        Comparar casas
      </summary>
      <ul className="mt-2 space-y-1">
        {odds.bookmakers.map((book) => (
          <li
            className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 py-1"
            key={book.key}
          >
            <span>{book.title}</span>
            <span className="flex gap-2">
              {book.moneyline?.home !== undefined ? (
                <span>L {formatearAmerican(book.moneyline.home)}</span>
              ) : null}
              {book.moneyline?.away !== undefined ? (
                <span>V {formatearAmerican(book.moneyline.away)}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function EventOdds({
  odds,
  homeName,
  awayName,
}: {
  odds?: EventoCuotas;
  homeName?: string;
  awayName?: string;
}) {
  if (!odds || !odds.available) {
    return (
      <p className="text-[11px] text-text-secondary">Cuotas no disponibles</p>
    );
  }

  return (
    <div className="space-y-3 border-t border-white/8 pt-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">
        Cuotas de mercado · consenso
      </p>
      <MoneylineMarket awayName={awayName} homeName={homeName} odds={odds} />
      <SpreadMarket odds={odds} />
      <TotalsMarket odds={odds} />
      <BookmakerComparison odds={odds} />
    </div>
  );
}
