import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import {
  LedgerDirection,
  type Prisma,
  WalletCurrency,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  ACTIVATION_PICKCOINS,
  ACTIVATION_REASON,
  PICK_STAKE_REASON,
} from './wallet.constants';

type Db = Prisma.TransactionClient | PrismaService;

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureActivationGrant(userId: string) {
    return this.prisma.$transaction((tx) => this.grantInTx(tx, userId));
  }

  async grantInTx(tx: Db, userId: string) {
    const existing = await tx.walletLedger.findFirst({
      where: {
        userId,
        reason: ACTIVATION_REASON,
        currency: WalletCurrency.PICKCOINS,
      },
    });
    if (existing) {
      return this.walletOrCreate(tx, userId);
    }

    const wallet = await this.walletOrCreate(tx, userId);

    try {
      await tx.walletLedger.create({
        data: {
          userId,
          currency: WalletCurrency.PICKCOINS,
          direction: LedgerDirection.CREDIT,
          amount: ACTIVATION_PICKCOINS,
          reason: ACTIVATION_REASON,
          refType: 'user',
          refId: userId,
        },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        return this.walletOrCreate(tx, userId);
      }
      throw error;
    }

    return tx.wallet.update({
      where: { id: wallet.id },
      data: {
        pickCoins: { increment: ACTIVATION_PICKCOINS },
        version: { increment: 1 },
      },
    });
  }

  async debitPickCoins(
    tx: Db,
    userId: string,
    amount: number,
    pickId: string,
  ) {
    if (amount <= 0) {
      throw new BadRequestException('El monto del pick no es válido');
    }

    const wallet = await this.walletOrCreate(tx, userId);
    if (wallet.pickCoins < amount) {
      throw new BadRequestException('No tienes PickCoins suficientes');
    }

    const updated = await tx.wallet.updateMany({
      where: {
        userId,
        version: wallet.version,
        pickCoins: { gte: amount },
      },
      data: {
        pickCoins: { decrement: amount },
        version: { increment: 1 },
      },
    });

    if (updated.count !== 1) {
      throw new ConflictException('El saldo cambió. Intenta de nuevo.');
    }

    await tx.walletLedger.create({
      data: {
        userId,
        currency: WalletCurrency.PICKCOINS,
        direction: LedgerDirection.DEBIT,
        amount,
        reason: PICK_STAKE_REASON,
        refType: 'pick',
        refId: pickId,
      },
    });

    return tx.wallet.findUniqueOrThrow({ where: { userId } });
  }

  private async walletOrCreate(tx: Db, userId: string) {
    const wallet = await tx.wallet.findUnique({ where: { userId } });
    if (wallet) return wallet;
    return tx.wallet.create({ data: { userId } });
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }
}
