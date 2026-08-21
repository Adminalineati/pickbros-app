import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = modulo.get(HealthController);
  });

  it('responde que el servicio está bien', () => {
    expect(controller.obtenerSalud()).toEqual({
      status: 'ok',
      service: 'pickbros-api',
    });
  });
});
