import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OddsModule } from '../odds/odds.module';
import { WalletModule } from '../wallet/wallet.module';
import { PicksController } from './picks.controller';
import { PicksService } from './picks.service';

@Module({
  imports: [AuthModule, OddsModule, WalletModule],
  controllers: [PicksController],
  providers: [PicksService],
})
export class PicksModule {}
