import { Injectable } from '@nestjs/common';
import type { DashboardRespuesta } from '@pickbros/types';
import { dashboardMock } from '../../common/mocks';

@Injectable()
export class DashboardService {
  obtener(): DashboardRespuesta {
    return dashboardMock;
  }
}
