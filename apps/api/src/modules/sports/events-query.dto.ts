import { League } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class EventsQueryDto {
  @IsOptional()
  @IsEnum(League)
  league?: League;
}
