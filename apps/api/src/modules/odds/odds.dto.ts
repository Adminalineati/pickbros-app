import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import type { LigaDeportiva } from '@pickbros/types';

export class OddsMarketsQueryDto {
  @IsOptional()
  @IsString()
  markets?: string;
}

export class EventOddsQueryDto {
  @IsString()
  liga!: string;

  @IsString()
  local!: string;

  @IsString()
  visitante!: string;

  @IsISO8601()
  iniciaEn!: string;

  @IsOptional()
  @IsString()
  markets?: string;
}

export class EventoAsociarDto {
  @IsString()
  id!: string;

  @IsString()
  liga!: LigaDeportiva;

  @IsString()
  localNombre!: string;

  @IsString()
  visitanteNombre!: string;

  @IsISO8601()
  iniciaEn!: string;
}

export class AsociarCuotasDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => EventoAsociarDto)
  eventos!: EventoAsociarDto[];
}
