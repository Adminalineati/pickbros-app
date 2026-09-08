import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface LocalSessionUser {
  sub: string;
  email: string;
  subscriptionPlan: 'FREE' | 'PREMIUM';
}

export const SESSION_COOKIE = 'pickbros_session';

@Injectable()
export class LocalJwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: LocalSessionUser }>();
    const [type, bearerToken] =
      request.headers.authorization?.split(' ') ?? [];
    const token =
      type === 'Bearer' && bearerToken
        ? bearerToken
        : this.readCookie(request, SESSION_COOKIE);

    if (!token) {
      throw new UnauthorizedException('Inicia sesión para continuar');
    }

    try {
      request.user = await this.jwt.verifyAsync<LocalSessionUser>(token);
      return true;
    } catch {
      throw new UnauthorizedException('La sesión ya no es válida');
    }
  }

  private readCookie(request: Request, name: string) {
    const cookie = request.headers.cookie
      ?.split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${name}=`));

    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined;
  }
}
