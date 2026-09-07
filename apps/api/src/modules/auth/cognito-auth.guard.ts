import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { Request } from 'express';
import type { AuthUser } from './auth-user';
import { IS_PUBLIC_KEY } from './public.decorator';

type AuthenticatedRequest = Request & { user?: AuthUser };

@Injectable()
export class CognitoAuthGuard implements CanActivate {
  private readonly required = process.env.AUTH_REQUIRED === 'true';
  private readonly verifier = this.createVerifier();

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic || !this.required) {
      return true;
    }

    if (!this.verifier) {
      throw new UnauthorizedException('Cognito no está configurado');
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.readBearerToken(request);

    try {
      const payload = await this.verifier.verify(token);
      request.user = {
        sub: payload.sub,
        username:
          typeof payload.username === 'string' ? payload.username : undefined,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        groups: Array.isArray(payload['cognito:groups'])
          ? payload['cognito:groups']
          : [],
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o vencido');
    }
  }

  private createVerifier() {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;

    if (!userPoolId || !clientId) {
      return undefined;
    }

    return CognitoJwtVerifier.create({
      userPoolId,
      clientId,
      tokenUse: 'access',
    });
  }

  private readBearerToken(request: Request): string {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Falta el token Bearer');
    }

    return token;
  }
}
