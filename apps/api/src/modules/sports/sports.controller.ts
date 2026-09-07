import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventsQueryDto } from './events-query.dto';
import { SportsService } from './sports.service';

@Controller('deportes')
export class SportsController {
  constructor(private readonly sports: SportsService) {}

  @Get('eventos')
  eventos(@Query() query: EventsQueryDto) {
    return this.sports.eventos(query.league);
  }

  @Get('competiciones/:competitionId/clasificacion')
  clasificacion(@Param('competitionId') competitionId: string) {
    return this.sports.clasificacion(competitionId);
  }
}
