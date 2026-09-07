import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CognitoAuthGuard } from './modules/auth/cognito-auth.guard';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DatabaseModule } from './modules/database/database.module';
import { HealthModule } from './modules/health/health.module';
import { SportsModule } from './modules/sports/sports.module';
import { StoreModule } from './modules/store/store.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    AuthModule,
    HealthModule,
    DatabaseModule,
    DashboardModule,
    SportsModule,
    StoreModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CognitoAuthGuard,
    },
  ],
})
export class AppModule {}
