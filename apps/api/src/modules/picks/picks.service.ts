import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventStatus,
  League,
  PickMarket,
  PickMarketPosition,
  PickSelection,
  Prisma,
  SubscriptionPlan,
  type Pick as PickRow,
  type SportEvent,
} from '@prisma/client';
import type { EventoCuotas, LigaDeportiva, PosicionMercado } from '@pickbros/types';
import { PrismaService } from '../database/prisma.service';
import { OddsService } from '../odds/odds.service';
import {
  FREE_MAX_STAKE,
  MIN_BALANCE_TO_PICK,
  MIN_PICK_STAKE,
  PREMIUM_MAX_STAKE,
} from '../wallet/wallet.constants';
import { WalletService } from '../wallet/wallet.service';
import type { CreatePickDto } from './picks.dto';
import { startOfZonedDay } from './zoned-day';

const LIGA_TO_LEAGUE: Record<string, League> = {
  MLB: League.MLB,
  NBA: League.NBA,
  NFL: League.NFL,
  Champions: League.CHAMPIONS,
  CHAMPIONS: League.CHAMPIONS,
};

const LEAGUE_TO_LIGA: Record<League, LigaDeportiva> = {
  MLB: 'MLB',
  NBA: 'NBA',
  NFL: 'NFL',
  CHAMPIONS: 'Champions',
};

const POSITION_TO_ENUM: Record<PosicionMercado, PickMarketPosition> = {
  favorito: PickMarketPosition.FAVORITO,
  underdog: PickMarketPosition.UNDERDOG,
  even: PickMarketPosition.EVEN,
};

@Injectable()
export class PicksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly odds: OddsService,
  ) {}

  async crear(userId: string, input: CreatePickDto) {
    this.assertEnabled();
    this.assertMarket(input);

    const startsAt = new Date(input.iniciaEn);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      throw new ConflictException('El evento ya cerró. Ya no puedes hacer este pick.');
    }
    if (this.eventoCerrado(input.estado)) {
      throw new ConflictException('El evento ya cerró. Ya no puedes hacer este pick.');
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { wallet: true },
    });
    this.assertStake(user.subscriptionPlan, input.stakePickCoins, user.wallet?.pickCoins ?? 0);

    if (user.subscriptionPlan === SubscriptionPlan.FREE) {
      const todayPicks = await this.prisma.pick.count({
        where: {
          userId,
          createdAt: { gte: startOfZonedDay() },
        },
      });
      if (todayPicks >= 1) {
        throw new ConflictException(
          'En el plan Free solo puedes hacer 1 pick al día.',
        );
      }
    }

    const league = this.toLeague(input.liga);
    const odds = await this.lookupOdds(input);
    this.assertOddsMarket(input, odds);
    const oddsFields = this.oddsFields(input, odds);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (user.subscriptionPlan === SubscriptionPlan.FREE) {
          const todayPicks = await tx.pick.count({
            where: {
              userId,
              createdAt: { gte: startOfZonedDay() },
            },
          });
          if (todayPicks >= 1) {
            throw new ConflictException(
              'En el plan Free solo puedes hacer 1 pick al día.',
            );
          }
        }

        const event = await this.upsertEvent(tx, input, league, startsAt);
        if (event.status !== EventStatus.SCHEDULED || event.startsAt.getTime() <= Date.now()) {
          throw new ConflictException('El evento ya cerró. Ya no puedes hacer este pick.');
        }

        const pick = await tx.pick.create({
          data: {
            userId,
            eventId: event.id,
            market: input.mercado,
            selection: input.seleccion,
            stakePickCoins: input.stakePickCoins,
            homeScore: input.homeScore,
            awayScore: input.awayScore,
            totalLine: input.totalLine,
            oddsAmerican: oddsFields.oddsAmerican,
            impliedProbability: oddsFields.impliedProbability,
            marketPosition: oddsFields.marketPosition,
            oddsSnapshot: oddsFields.oddsSnapshot,
            lockedAt: event.startsAt,
          },
          include: { event: true },
        });

        const wallet = await this.wallet.debitPickCoins(
          tx,
          userId,
          input.stakePickCoins,
          pick.id,
        );

        return this.toRespuesta(pick, wallet.pickCoins);
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Ya registraste un pronóstico para este evento.');
      }
      if (this.isTransactionConflict(error)) {
        throw new ConflictException(
          'Otro movimiento cambió tu saldo. Intenta de nuevo.',
        );
      }
      throw error;
    }
  }

  async listar(userId: string, take = 50) {
    this.assertEnabled();
    const picks = await this.prisma.pick.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(take, 1), 100),
    });
    return picks.map((pick) => this.toRespuesta(pick));
  }

  async obtener(userId: string, id: string) {
    this.assertEnabled();
    const pick = await this.prisma.pick.findFirst({
      where: { id, userId },
      include: { event: true },
    });
    if (!pick) {
      throw new NotFoundException('No encontramos ese pick');
    }
    return this.toRespuesta(pick);
  }

  private assertEnabled() {
    if (!this.prisma.listo) {
      throw new BadRequestException('La base de datos no está disponible');
    }
  }

  private assertMarket(input: CreatePickDto) {
    if (input.mercado === PickMarket.MONEYLINE) {
      if (
        input.seleccion !== PickSelection.HOME &&
        input.seleccion !== PickSelection.AWAY &&
        input.seleccion !== PickSelection.DRAW
      ) {
        throw new BadRequestException('Elige local, visitante o empate.');
      }
      return;
    }

    if (input.mercado === PickMarket.EXACT_SCORE) {
      if (input.homeScore === undefined || input.awayScore === undefined) {
        throw new BadRequestException('Indica el marcador exacto.');
      }
      return;
    }

    if (input.seleccion !== PickSelection.OVER && input.seleccion !== PickSelection.UNDER) {
      throw new BadRequestException('Elige Over o Under.');
    }
    if (input.totalLine === undefined) {
      throw new BadRequestException('Falta la línea de Over/Under.');
    }
  }

  private assertStake(
    plan: SubscriptionPlan,
    stake: number,
    balance: number,
  ) {
    if (balance < MIN_BALANCE_TO_PICK) {
      throw new BadRequestException(
        'Necesitas al menos 30 PickCoins para realizar un pick.',
      );
    }
    if (stake < MIN_PICK_STAKE) {
      throw new BadRequestException('El pick mínimo es de 30 PickCoins.');
    }
    if (plan === SubscriptionPlan.FREE && stake > FREE_MAX_STAKE) {
      throw new BadRequestException(
        'En el plan Free el pick máximo es de 30 PickCoins.',
      );
    }
    if (plan === SubscriptionPlan.PREMIUM && stake > PREMIUM_MAX_STAKE) {
      throw new BadRequestException(
        'En Premium el pick máximo es de 100 PickCoins por pronóstico.',
      );
    }
    if (balance < stake) {
      throw new BadRequestException('No tienes PickCoins suficientes');
    }
  }

  private eventoCerrado(estado?: string) {
    return (
      estado === 'EN_VIVO' ||
      estado === 'FINALIZADO' ||
      estado === 'CANCELADO' ||
      estado === 'POSPUESTO'
    );
  }

  private toLeague(liga: string) {
    const league = LIGA_TO_LEAGUE[liga];
    if (!league) {
      throw new BadRequestException(`Liga no soportada: ${liga}`);
    }
    return league;
  }

  private async upsertEvent(
    tx: Prisma.TransactionClient,
    input: CreatePickDto,
    league: League,
    startsAt: Date,
  ) {
    const slug = input.eventId.startsWith('demo-') ? 'demo' : 'highlightly';
    const provider = await tx.sportsDataProvider.upsert({
      where: { slug },
      create: {
        slug,
        name: slug === 'demo' ? 'Demo' : 'Highlightly',
      },
      update: {},
    });

    return tx.sportEvent.upsert({
      where: {
        providerId_externalId: {
          providerId: provider.id,
          externalId: input.eventId,
        },
      },
      create: {
        league,
        homeName: input.localNombre,
        homeCode: input.localCodigo.slice(0, 8),
        awayName: input.visitanteNombre,
        awayCode: input.visitanteCodigo.slice(0, 8),
        startsAt,
        status: EventStatus.SCHEDULED,
        providerId: provider.id,
        externalId: input.eventId,
        rawPayload: input as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      },
      update: {
        league,
        homeName: input.localNombre,
        homeCode: input.localCodigo.slice(0, 8),
        awayName: input.visitanteNombre,
        awayCode: input.visitanteCodigo.slice(0, 8),
        startsAt,
        status: EventStatus.SCHEDULED,
        rawPayload: input as unknown as Prisma.InputJsonValue,
        syncedAt: new Date(),
      },
    });
  }

  private async lookupOdds(input: CreatePickDto): Promise<EventoCuotas | null> {
    try {
      const liga = this.toLiga(input.liga);
      if (!liga) return null;
      const odds = await this.odds.cuotasDeEvento({
        id: input.eventId,
        liga,
        localNombre: input.localNombre,
        visitanteNombre: input.visitanteNombre,
        iniciaEn: input.iniciaEn,
      });
      return odds.available ? odds : null;
    } catch {
      return null;
    }
  }

  private toLiga(liga: string): LigaDeportiva | null {
    if (liga === 'MLB' || liga === 'NBA' || liga === 'NFL' || liga === 'Champions') {
      return liga;
    }
    if (liga === 'CHAMPIONS') return 'Champions';
    return null;
  }

  private assertOddsMarket(
    input: CreatePickDto,
    odds: EventoCuotas | null,
  ) {
    if (!odds) return;
    if (
      input.mercado === PickMarket.MONEYLINE &&
      input.seleccion === PickSelection.DRAW &&
      odds.markets.moneyline?.draw === undefined
    ) {
      throw new BadRequestException('Este evento no ofrece la opción de empate.');
    }
    if (
      input.mercado === PickMarket.TOTAL &&
      odds.markets.total &&
      input.totalLine !== odds.markets.total.line
    ) {
      throw new BadRequestException(
        'La línea de Over/Under cambió. Actualiza el evento e intenta de nuevo.',
      );
    }
  }

  private oddsFields(input: CreatePickDto, odds: EventoCuotas | null) {
    if (!odds) {
      return {
        oddsAmerican: undefined,
        impliedProbability: undefined,
        marketPosition: undefined,
        oddsSnapshot: undefined as Prisma.InputJsonValue | undefined,
      };
    }

    let oddsAmerican: number | undefined;
    let impliedProbability: number | undefined;
    let marketPosition: PickMarketPosition | undefined;

    if (input.mercado === PickMarket.MONEYLINE) {
      if (input.seleccion === PickSelection.HOME) {
        oddsAmerican = odds.markets.moneyline?.home ?? odds.homeTeam.moneyline;
        impliedProbability = odds.homeTeam.impliedProbability;
        marketPosition = odds.homeTeam.marketPosition
          ? POSITION_TO_ENUM[odds.homeTeam.marketPosition]
          : undefined;
      } else if (input.seleccion === PickSelection.AWAY) {
        oddsAmerican = odds.markets.moneyline?.away ?? odds.awayTeam.moneyline;
        impliedProbability = odds.awayTeam.impliedProbability;
        marketPosition = odds.awayTeam.marketPosition
          ? POSITION_TO_ENUM[odds.awayTeam.marketPosition]
          : undefined;
      } else {
        oddsAmerican = odds.markets.moneyline?.draw;
        marketPosition = PickMarketPosition.EVEN;
      }
    } else if (input.mercado === PickMarket.TOTAL) {
      oddsAmerican =
        input.seleccion === PickSelection.OVER
          ? odds.markets.total?.over
          : odds.markets.total?.under;
    }

    return {
      oddsAmerican,
      impliedProbability,
      marketPosition,
      oddsSnapshot: odds as unknown as Prisma.InputJsonValue,
    };
  }

  private toRespuesta(
    pick: PickRow & { event: SportEvent },
    pickCoins?: number,
  ) {
    return {
      id: pick.id,
      eventId: pick.event.externalId ?? pick.eventId,
      liga: LEAGUE_TO_LIGA[pick.event.league],
      local: pick.event.homeName,
      visitante: pick.event.awayName,
      iniciaEn: pick.event.startsAt.toISOString(),
      mercado: pick.market,
      seleccion: pick.selection,
      stakePickCoins: pick.stakePickCoins,
      homeScore: pick.homeScore,
      awayScore: pick.awayScore,
      totalLine: pick.totalLine,
      oddsAmerican: pick.oddsAmerican,
      impliedProbability: pick.impliedProbability,
      marketPosition: pick.marketPosition
        ? (pick.marketPosition.toLowerCase() as 'favorito' | 'underdog' | 'even')
        : null,
      resultado: pick.result,
      puntos: pick.points,
      createdAt: pick.createdAt.toISOString(),
      pickCoins,
    };
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }

  private isTransactionConflict(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2034'
    );
  }
}
