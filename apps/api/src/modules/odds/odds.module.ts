import { Module } from '@nestjs/common';
import { TheOddsApiClient } from '../../integrations/the-odds-api/the-odds-api.client';
import { OddsCacheService } from './odds-cache.service';
import { OddsController } from './odds.controller';
import { OddsService } from './odds.service';

@Module({
  controllers: [OddsController],
  providers: [OddsService, OddsCacheService, TheOddsApiClient],
  exports: [OddsService],
})
export class OddsModule {}
