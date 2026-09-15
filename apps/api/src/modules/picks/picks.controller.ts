import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
import type { LocalSessionUser } from '../auth/local-jwt.guard';
import { ProductAuthGuard } from '../auth/product-auth.guard';
import { CreatePickDto } from './picks.dto';
import { PicksService } from './picks.service';

@Controller('picks')
@Public()
@UseGuards(ProductAuthGuard)
export class PicksController {
  constructor(private readonly picks: PicksService) {}

  @Post()
  crear(
    @Req() request: Request & { user: LocalSessionUser },
    @Body() input: CreatePickDto,
  ) {
    return this.picks.crear(request.user.sub, input);
  }

  @Get()
  listar(
    @Req() request: Request & { user: LocalSessionUser },
    @Query('take') take?: string,
  ) {
    const parsed = take ? Number(take) : 50;
    return this.picks.listar(request.user.sub, Number.isFinite(parsed) ? parsed : 50);
  }

  @Get(':id')
  obtener(
    @Req() request: Request & { user: LocalSessionUser },
    @Param('id') id: string,
  ) {
    return this.picks.obtener(request.user.sub, id);
  }
}
