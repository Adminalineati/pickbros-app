import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private conectado = false;

  constructor() {
    super({
      log: ['error'],
      datasources: {
        db: {
          url:
            process.env.DATABASE_URL ??
            'postgresql://pickbros:pickbros@127.0.0.1:5432/pickbros',
        },
      },
    });
  }

  get listo(): boolean {
    return this.conectado;
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      this.logger.warn('No hay DATABASE_URL. Seguimos con mocks.');
      return;
    }

    await this.$connect();
    this.conectado = true;
  }

  async onModuleDestroy() {
    if (this.conectado) {
      await this.$disconnect();
    }
  }
}
