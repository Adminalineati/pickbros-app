import { HttpStatus } from '@nestjs/common';
import {
  EventStatus,
  League,
  PickMarket,
  PickSelection,
  SubscriptionPlan,
} from '@prisma/client';
import { PicksService } from './picks.service';

const future = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

function eventInput() {
  return {
    eventId: 'highlightly:mlb:99',
    liga: 'MLB',
    localNombre: 'Yankees',
    localCodigo: 'NYY',
    visitanteNombre: 'Red Sox',
    visitanteCodigo: 'BOS',
    iniciaEn: future,
    estado: 'PROGRAMADO',
    mercado: PickMarket.MONEYLINE,
    seleccion: PickSelection.HOME,
    stakePickCoins: 30,
  };
}

describe('PicksService', () => {
  it('crea el pick, persiste el evento y descuenta PickCoins', async () => {
    const created = {
      id: 'pick-1',
      market: PickMarket.MONEYLINE,
      selection: PickSelection.HOME,
      stakePickCoins: 30,
      homeScore: null,
      awayScore: null,
      totalLine: null,
      oddsAmerican: -150,
      impliedProbability: 60,
      marketPosition: null,
      result: 'PENDING',
      points: 0,
      createdAt: new Date(),
      event: {
        externalId: 'highlightly:mlb:99',
        league: League.MLB,
        homeName: 'Yankees',
        awayName: 'Red Sox',
        startsAt: new Date(future),
      },
    };
    const tx = {
      sportsDataProvider: {
        upsert: jest.fn(async () => ({ id: 'prov-1' })),
      },
      sportEvent: {
        upsert: jest.fn(async () => ({
          id: 'evt-1',
          status: EventStatus.SCHEDULED,
          startsAt: new Date(future),
        })),
      },
      pick: {
        count: jest.fn(async () => 0),
        create: jest.fn(async () => created),
      },
    };
    const prisma = {
      listo: true,
      user: {
        findUniqueOrThrow: jest.fn(async () => ({
          id: 'u1',
          subscriptionPlan: SubscriptionPlan.FREE,
          wallet: { pickCoins: 30 },
        })),
      },
      pick: { count: jest.fn(async () => 0) },
      $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    const wallet = {
      debitPickCoins: jest.fn(async () => ({ pickCoins: 0 })),
    };
    const odds = {
      cuotasDeEvento: jest.fn(async () => ({ available: false })),
    };
    const service = new PicksService(prisma as never, wallet as never, odds as never);
    const result = await service.crear('u1', eventInput());

    expect(result.id).toBe('pick-1');
    expect(result.pickCoins).toBe(0);
    expect(wallet.debitPickCoins).toHaveBeenCalledWith(tx, 'u1', 30, 'pick-1');
    expect(tx.sportEvent.upsert).toHaveBeenCalled();
  });

  it('rechaza un segundo pick Free el mismo día', async () => {
    const service = serviceWith({
      user: {
        findUniqueOrThrow: jest.fn(async () => ({
          id: 'u1',
          subscriptionPlan: SubscriptionPlan.FREE,
          wallet: { pickCoins: 30 },
        })),
      },
      pick: { count: jest.fn(async () => 1) },
    });

    await expect(service.crear('u1', eventInput())).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
    });
  });

  it('rechaza si el evento ya empezó', async () => {
    const service = serviceWith({
      user: {
        findUniqueOrThrow: jest.fn(async () => ({
          id: 'u1',
          subscriptionPlan: SubscriptionPlan.PREMIUM,
          wallet: { pickCoins: 30 },
        })),
      },
      pick: { count: jest.fn(async () => 0) },
    });

    await expect(
      service.crear('u1', {
        ...eventInput(),
        iniciaEn: new Date(Date.now() - 60_000).toISOString(),
      }),
    ).rejects.toMatchObject({ status: HttpStatus.CONFLICT });
  });

  it('rechaza si no hay al menos 30 PickCoins', async () => {
    const service = serviceWith({
      user: {
        findUniqueOrThrow: jest.fn(async () => ({
          id: 'u1',
          subscriptionPlan: SubscriptionPlan.PREMIUM,
          wallet: { pickCoins: 10 },
        })),
      },
      pick: { count: jest.fn(async () => 0) },
    });

    await expect(service.crear('u1', eventInput())).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
  });
});

function serviceWith(prismaUser: Record<string, unknown>) {
  const prisma = {
    listo: true,
    ...prismaUser,
    $transaction: jest.fn(),
  };
  return new PicksService(
    prisma as never,
    { debitPickCoins: jest.fn() } as never,
    { cuotasDeEvento: jest.fn() } as never,
  );
}
