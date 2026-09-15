import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { DashboardRespuesta } from '@pickbros/types';
import type { Request } from 'express';
import {
  OptionalLocalJwtGuard,
  type LocalSessionUser,
} from '../auth/local-jwt.guard';
import { Public } from '../auth/public.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@Public()
@UseGuards(OptionalLocalJwtGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  obtener(
    @Req() request: Request & { user?: LocalSessionUser },
  ): Promise<DashboardRespuesta> {
    return this.dashboardService.obtener(request.user?.sub);
  }
}
