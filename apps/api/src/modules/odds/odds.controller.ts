import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import type { EventoParaAsociarCuotas, LigaDeportiva } from '@pickbros/types';
import { Public } from '../auth/public.decorator';
import { AsociarCuotasDto, EventOddsQueryDto, OddsMarketsQueryDto } from './odds.dto';
import { OddsService } from './odds.service';
import { parseLiga } from './odds-sports';

const FEATURED = new Set(['h2h', 'spreads', 'totals']);

@Controller()
@Public()
export class OddsController {
  constructor(private readonly odds: OddsService) {}

  @Get('cuotas/:liga')
  listar(
    @Param('liga') ligaParam: string,
    @Query() query: OddsMarketsQueryDto,
  ) {
    return this.odds.listarPorLiga(this.liga(ligaParam), this.markets(query.markets));
  }

  @Get('odds/:liga')
  listarAlias(
    @Param('liga') ligaParam: string,
    @Query() query: OddsMarketsQueryDto,
  ) {
    return this.listar(ligaParam, query);
  }

  @Get('eventos/:eventId/cuotas')
  evento(
    @Param('eventId') eventId: string,
    @Query() query: EventOddsQueryDto,
  ) {
    const payload: EventoParaAsociarCuotas = {
      id: eventId,
      liga: this.liga(query.liga),
      localNombre: query.local,
      visitanteNombre: query.visitante,
      iniciaEn: query.iniciaEn,
    };
    return this.odds.cuotasDeEvento(payload);
  }

  @Get('events/:eventId/odds')
  eventoAlias(
    @Param('eventId') eventId: string,
    @Query() query: EventOddsQueryDto,
  ) {
    return this.evento(eventId, query);
  }

  @Post('cuotas/asociar')
  asociar(@Body() body: AsociarCuotasDto) {
    const eventos = body.eventos.map((event) => ({
      ...event,
      liga: this.liga(event.liga),
    }));
    return this.odds.asociar(eventos);
  }

  private liga(value: string): LigaDeportiva {
    const liga = parseLiga(value);
    if (!liga) {
      throw new BadRequestException(`Liga no soportada: ${value}`);
    }
    return liga;
  }

  private markets(value?: string) {
    if (!value) return undefined;
    const parsed = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => FEATURED.has(item));
    return parsed.length ? parsed : undefined;
  }
}
