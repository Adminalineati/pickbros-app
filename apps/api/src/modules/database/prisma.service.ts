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
          url: PrismaService.databaseUrl(),
        },
      },
    });
  }

  get listo(): boolean {
    return this.conectado;
  }

  async comprobarConexion(): Promise<boolean> {
    if (!this.conectado) {
      return false;
    }

    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
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

  private static databaseUrl(): string {
    if (process.env.DATABASE_URL) {
      return process.env.DATABASE_URL;
    }

    const {
      DB_HOST: host,
      DB_NAME: database,
      DB_PASSWORD: password,
      DB_PORT: port = '5432',
      DB_USERNAME: username,
    } = process.env;

    if (host && database && password && username) {
      return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}?sslmode=require`;
    }

    return 'postgresql://pickbros:pickbros@127.0.0.1:5432/pickbros';
  }
}
