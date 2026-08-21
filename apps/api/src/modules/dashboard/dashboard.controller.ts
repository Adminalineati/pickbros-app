import { Controller, Get } from '@nestjs/common';
import type { DashboardRespuesta } from '@pickbros/types';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  obtener(): DashboardRespuesta {
    return this.dashboardService.obtener();
  }
}
