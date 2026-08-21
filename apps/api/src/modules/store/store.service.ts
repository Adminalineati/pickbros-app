import { Injectable } from '@nestjs/common';
import type { TiendaRespuesta } from '@pickbros/types';
import { tiendaMock } from '../../common/mocks';

@Injectable()
export class StoreService {
  obtener(): TiendaRespuesta {
    return tiendaMock;
  }
}
