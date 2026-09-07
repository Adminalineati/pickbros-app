import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            listo: false,
            comprobarConexion: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = modulo.get(HealthController);
  });

  it('responde que el servicio está bien', () => {
    expect(controller.obtenerSalud()).toEqual({
      status: 'ok',
      service: 'pickbros-api',
    });
  });

  it('permite readiness sin base configurada', async () => {
    await expect(controller.obtenerDisponibilidad()).resolves.toEqual({
      status: 'ok',
      service: 'pickbros-api',
      database: 'not-configured',
    });
  });
});
