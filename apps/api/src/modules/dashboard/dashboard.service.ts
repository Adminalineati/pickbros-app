import { Injectable } from '@nestjs/common';
import type { DashboardRespuesta } from '@pickbros/types';
import { dashboardMock } from '../../common/mocks';
import { PrismaService } from '../database/prisma.service';

const guest: DashboardRespuesta = {
  usuario: {
    nombre: 'PickBro',
    saludo: '¿Qué onda!',
  },
  rango: {
    nombre: 'Rookie',
    nivel: 1,
  },
  pickCoins: 0,
  pickets: 0,
  rachaDias: 0,
  challengeDelDia: dashboardMock.challengeDelDia,
  eventosDestacados: [],
  rankingSemanal: [],
  misiones: dashboardMock.misiones,
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(userId?: string): Promise<DashboardRespuesta> {
    if (!this.prisma.listo) {
      return guest;
    }

    const rankingRows = await this.prisma.user.findMany({
      where: { emailVerifiedAt: { not: null } },
      orderBy: [{ xp: 'desc' }, { createdAt: 'asc' }],
      take: 10,
      select: {
        id: true,
        username: true,
        displayName: true,
        firstName: true,
        xp: true,
      },
    });

    const rankingSemanal = rankingRows.map((user, index) => ({
      puesto: index + 1,
      alias: user.firstName || user.displayName || user.username,
      puntos: user.xp,
      esUsuarioActual: userId ? user.id === userId : false,
    }));

    if (!userId) {
      return { ...guest, rankingSemanal };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true, rank: true },
    });

    if (!user) {
      return { ...guest, rankingSemanal };
    }

    const nombre = user.firstName ?? user.displayName;
    return {
      usuario: {
        nombre,
        saludo: `¿Qué onda, ${nombre}! 👋`,
      },
      rango: {
        nombre: user.rank?.name ?? 'Rookie',
        nivel: user.level,
      },
      pickCoins: user.wallet?.pickCoins ?? 0,
      pickets: user.wallet?.pickets ?? 0,
      rachaDias: user.streakDays,
      challengeDelDia: dashboardMock.challengeDelDia,
      eventosDestacados: [],
      rankingSemanal,
      misiones: dashboardMock.misiones,
    };
  }
}
