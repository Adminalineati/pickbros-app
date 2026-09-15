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
  constructor(protected readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: LocalSessionUser }>();
    const token = this.readToken(request);

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

  protected readToken(request: Request) {
    const [type, bearerToken] =
      request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && bearerToken) {
      return bearerToken;
    }
    return this.readCookie(request, SESSION_COOKIE);
  }

  protected readCookie(request: Request, name: string) {
    const cookie = request.headers.cookie
      ?.split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith(`${name}=`));

    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined;
  }
}

@Injectable()
export class OptionalLocalJwtGuard extends LocalJwtGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: LocalSessionUser }>();
    const token = this.readToken(request);

    if (!token) {
      return true;
    }

    try {
      request.user = await this.jwt.verifyAsync<LocalSessionUser>(token);
    } catch {
      request.user = undefined;
    }

    return true;
  }
}
