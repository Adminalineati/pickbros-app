import { Controller, Get } from '@nestjs/common';
import type { SaludRespuesta } from '@pickbros/types';

@Controller('health')
export class HealthController {
  @Get()
  obtenerSalud(): SaludRespuesta {
    return {
      status: 'ok',
      service: 'pickbros-api',
    };
  }
}
