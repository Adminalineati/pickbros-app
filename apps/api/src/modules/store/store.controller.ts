import { Controller, Get } from '@nestjs/common';
import type { TiendaRespuesta } from '@pickbros/types';
import { StoreService } from './store.service';

@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  obtener(): TiendaRespuesta {
    return this.storeService.obtener();
  }
}
