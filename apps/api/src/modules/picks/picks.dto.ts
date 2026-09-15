import { PickMarket, PickSelection } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePickDto {
  @IsString()
  eventId!: string;

  @IsString()
  liga!: string;

  @IsString()
  localNombre!: string;

  @IsString()
  localCodigo!: string;

  @IsString()
  visitanteNombre!: string;

  @IsString()
  visitanteCodigo!: string;

  @IsISO8601()
  iniciaEn!: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsEnum(PickMarket)
  mercado!: PickMarket;

  @IsEnum(PickSelection)
  seleccion!: PickSelection;

  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(100)
  stakePickCoins!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99)
  homeScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(99)
  awayScore?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalLine?: number;
}
