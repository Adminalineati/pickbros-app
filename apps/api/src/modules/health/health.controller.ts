import { Controller, Get } from '@nestjs/common';
import type { SaludRespuesta } from '@pickbros/types';
import { Public } from '../auth/public.decorator';
import { PrismaService } from '../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  obtenerSalud(): SaludRespuesta {
    return {
      status: 'ok',
      service: 'pickbros-api',
    };
  }

  @Get('ready')
  @Public()
  async obtenerDisponibilidad() {
    const database = this.prisma.listo
      ? await this.prisma.comprobarConexion()
      : null;

    return {
      status: database === false ? 'degraded' : 'ok',
      service: 'pickbros-api',
      database: database === null ? 'not-configured' : database ? 'up' : 'down',
    };
  }
}
