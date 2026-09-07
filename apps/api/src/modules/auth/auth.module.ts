import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { LOCAL_JWT, LocalAuthService } from './local-auth.service';
import { LocalJwtGuard } from './local-jwt.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'pickbros-local-demo',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LocalAuthService,
    LocalJwtGuard,
    {
      provide: LOCAL_JWT,
      useExisting: JwtService,
    },
  ],
})
export class AuthModule {}
