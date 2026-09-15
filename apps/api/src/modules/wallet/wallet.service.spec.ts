import { WalletCurrency } from '@prisma/client';
import { WalletService } from './wallet.service';
import { ACTIVATION_PICKCOINS, ACTIVATION_REASON } from './wallet.constants';

describe('WalletService', () => {
  it('acredita 30 PickCoins solo una vez', async () => {
    const ledger: Array<{ reason: string }> = [];
    const wallet = { id: 'w1', userId: 'u1', pickCoins: 0, version: 0 };
    const tx = {
      walletLedger: {
        findFirst: jest.fn(async () => ledger[0] ?? null),
        create: jest.fn(async ({ data }: { data: { reason: string } }) => {
          ledger.push(data);
          return data;
        }),
      },
      wallet: {
        findUnique: jest.fn(async () => wallet),
        create: jest.fn(),
        update: jest.fn(async ({ data }: { data: { pickCoins: { increment: number } } }) => {
          wallet.pickCoins += data.pickCoins.increment;
          wallet.version += 1;
          return wallet;
        }),
        findUniqueOrThrow: jest.fn(async () => wallet),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    const service = new WalletService(prisma as never);

    const first = await service.ensureActivationGrant('u1');
    const second = await service.ensureActivationGrant('u1');

    expect(first.pickCoins).toBe(ACTIVATION_PICKCOINS);
    expect(second.pickCoins).toBe(ACTIVATION_PICKCOINS);
    expect(tx.walletLedger.create).toHaveBeenCalledTimes(1);
    expect(tx.walletLedger.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: ACTIVATION_PICKCOINS,
        reason: ACTIVATION_REASON,
        currency: WalletCurrency.PICKCOINS,
      }),
    });
  });

  it('descuenta PickCoins y deja el ledger del pick', async () => {
    const wallet = { id: 'w1', userId: 'u1', pickCoins: 30, version: 1 };
    const tx = {
      wallet: {
        findUnique: jest.fn(async () => wallet),
        create: jest.fn(),
        updateMany: jest.fn(async () => {
          wallet.pickCoins -= 30;
          wallet.version += 1;
          return { count: 1 };
        }),
        findUniqueOrThrow: jest.fn(async () => wallet),
      },
      walletLedger: {
        create: jest.fn(async (payload: unknown) => payload),
      },
    };
    const service = new WalletService({} as never);
    const result = await service.debitPickCoins(tx as never, 'u1', 30, 'pick-1');

    expect(result.pickCoins).toBe(0);
    expect(tx.walletLedger.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 30,
        refId: 'pick-1',
        reason: 'PICK_STAKE',
      }),
    });
  });
});
