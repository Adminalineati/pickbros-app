import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { WalletModule } from '../wallet/wallet.module';
import { AuthController } from './auth.controller';
import { LOCAL_JWT, LocalAuthService } from './local-auth.service';
import { LocalJwtGuard, OptionalLocalJwtGuard } from './local-jwt.guard';
import { ProductAuthGuard } from './product-auth.guard';

@Module({
  imports: [
    WalletModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'pickbros-local-demo',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LocalAuthService,
    LocalJwtGuard,
    OptionalLocalJwtGuard,
    ProductAuthGuard,
    {
      provide: LOCAL_JWT,
      useExisting: JwtService,
    },
  ],
  exports: [
    LocalAuthService,
    LocalJwtGuard,
    OptionalLocalJwtGuard,
    ProductAuthGuard,
    JwtModule,
  ],
})
export class AuthModule {}
