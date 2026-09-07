import { Injectable } from '@nestjs/common';
import type { League } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SportsService {
  constructor(private readonly prisma: PrismaService) {}

  async eventos(league?: League) {
    if (!this.prisma.listo) {
      return [];
    }

    return this.prisma.sportEvent.findMany({
      where: {
        league,
        startsAt: {
          gte: new Date(Date.now() - 6 * 60 * 60 * 1000),
        },
      },
      orderBy: { startsAt: 'asc' },
      take: 100,
      include: {
        competition: true,
        homeTeam: true,
        awayTeam: true,
      },
    });
  }

  async clasificacion(competitionId: string) {
    if (!this.prisma.listo) {
      return [];
    }

    return this.prisma.standing.findMany({
      where: { competitionId },
      orderBy: { position: 'asc' },
      include: { team: true },
    });
  }
}
