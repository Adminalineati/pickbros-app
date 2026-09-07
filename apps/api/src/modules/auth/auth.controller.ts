import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './auth.dto';
import { LocalAuthService } from './local-auth.service';
import {
  LocalJwtGuard,
  type LocalSessionUser,
  SESSION_COOKIE,
} from './local-jwt.guard';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: LocalAuthService) {}

  @Post('register')
  @Public()
  register(@Body() input: RegisterDto) {
    return this.auth.register(input);
  }

  @Post('login')
  @Public()
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(input);
    response.cookie(SESSION_COOKIE, result.accessToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return {
      usuario: result.usuario,
      expiresIn: 3600,
    };
  }

  @Post('logout')
  @Public()
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
    return { mensaje: 'Sesión cerrada correctamente' };
  }

  @Post('verify-email')
  @Public()
  verifyEmail(@Body() input: VerifyEmailDto) {
    return this.auth.verifyEmail(input);
  }

  @Post('resend-verification')
  @Public()
  resendVerification(@Body() input: EmailDto) {
    return this.auth.resendVerification(input);
  }

  @Post('forgot-password')
  @Public()
  forgotPassword(@Body() input: EmailDto) {
    return this.auth.requestPasswordReset(input);
  }

  @Post('reset-password')
  @Public()
  resetPassword(@Body() input: ResetPasswordDto) {
    return this.auth.resetPassword(input);
  }

  @Get('me')
  @Public()
  @UseGuards(LocalJwtGuard)
  profile(@Req() request: Request & { user: LocalSessionUser }) {
    return this.auth.profile(request.user.sub);
  }
}
