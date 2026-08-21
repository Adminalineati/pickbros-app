import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UsuarioDto {
  @IsString()
  nombre!: string;

  @IsString()
  saludo!: string;
}

class RangoDto {
  @IsString()
  nombre!: string;

  @IsNumber()
  nivel!: number;
}

class EquipoDto {
  @IsString()
  nombre!: string;

  @IsString()
  iniciales!: string;

  @IsString()
  acento!: string;
}

class ChallengeDto {
  @IsString()
  titulo!: string;

  @IsString()
  pregunta!: string;

  @ValidateNested()
  @Type(() => EquipoDto)
  local!: EquipoDto;

  @ValidateNested()
  @Type(() => EquipoDto)
  visitante!: EquipoDto;

  @IsString()
  horario!: string;

  @IsNumber()
  premioPickCoins!: number;
}

class EventoDto {
  @IsString()
  id!: string;

  @IsString()
  liga!: string;

  @IsString()
  local!: string;

  @IsString()
  visitante!: string;

  @IsString()
  inicialesLocal!: string;

  @IsString()
  inicialesVisitante!: string;

  @IsString()
  horario!: string;
}

class RankingDto {
  @IsNumber()
  puesto!: number;

  @IsString()
  alias!: string;

  @IsNumber()
  puntos!: number;

  @IsOptional()
  @IsBoolean()
  esUsuarioActual?: boolean;
}

class MisionDto {
  @IsString()
  id!: string;

  @IsString()
  titulo!: string;

  @IsString()
  descripcion!: string;

  @IsNumber()
  progreso!: number;

  @IsNumber()
  meta!: number;
}

export class DashboardRespuestaDto {
  @ValidateNested()
  @Type(() => UsuarioDto)
  usuario!: UsuarioDto;

  @ValidateNested()
  @Type(() => RangoDto)
  rango!: RangoDto;

  @IsNumber()
  pickCoins!: number;

  @IsNumber()
  pickets!: number;

  @IsNumber()
  rachaDias!: number;

  @ValidateNested()
  @Type(() => ChallengeDto)
  challengeDelDia!: ChallengeDto;

  @ValidateNested({ each: true })
  @Type(() => EventoDto)
  eventosDestacados!: EventoDto[];

  @ValidateNested({ each: true })
  @Type(() => RankingDto)
  rankingSemanal!: RankingDto[];

  @ValidateNested({ each: true })
  @Type(() => MisionDto)
  misiones!: MisionDto[];
}
