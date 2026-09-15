import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountStatus, SubscriptionPlan } from '@prisma/client';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { Request } from 'express';
import { PrismaService } from '../database/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { LocalJwtGuard, type LocalSessionUser } from './local-jwt.guard';

type ProductRequest = Request & { user?: LocalSessionUser };

@Injectable()
export class ProductAuthGuard implements CanActivate {
  private readonly cognito = this.createCognitoVerifier();

  constructor(
    private readonly local: LocalJwtGuard,
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
  ) {}

  async canActivate(context: ExecutionContext) {
    if (process.env.AUTH_REQUIRED !== 'true') {
      return this.local.canActivate(context);
    }

    if (!this.cognito || !this.prisma.listo) {
      throw new UnauthorizedException('La autenticación no está disponible');
    }

    const request = context.switchToHttp().getRequest<ProductRequest>();
    const token = this.bearerToken(request);

    try {
      const payload = await this.cognito.verify(token);
      const email = typeof payload.email === 'string' ? payload.email : undefined;
      if (!email) {
        throw new UnauthorizedException('Tu sesión no incluye un correo válido');
      }

      const name =
        typeof payload.given_name === 'string'
          ? payload.given_name
          : email.split('@')[0] || 'Usuario';
      const lastName =
        typeof payload.family_name === 'string' ? payload.family_name : '';
      const membership = String(payload['custom:membership'] ?? '').toUpperCase();
      const subscriptionPlan =
        membership === 'PREMIUM'
          ? SubscriptionPlan.PREMIUM
          : SubscriptionPlan.FREE;

      const existing = await this.prisma.user.findFirst({
        where: { OR: [{ cognitoSub: payload.sub }, { email }] },
      });
      const user = existing
        ? await this.prisma.user.update({
            where: { id: existing.id },
            data: {
              cognitoSub: payload.sub,
              email,
              firstName: name,
              lastName,
              displayName: `${name} ${lastName}`.trim(),
              subscriptionPlan,
              accountStatus: AccountStatus.ACTIVE,
              emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
              lastActiveAt: new Date(),
            },
          })
        : await this.prisma.user.create({
            data: {
              cognitoSub: payload.sub,
              email,
              username: `cognito-${payload.sub}`,
              firstName: name,
              lastName,
              displayName: `${name} ${lastName}`.trim(),
              subscriptionPlan,
              accountStatus: AccountStatus.ACTIVE,
              emailVerifiedAt: new Date(),
              lastActiveAt: new Date(),
              wallet: { create: {} },
            },
          });

      await this.wallet.ensureActivationGrant(user.id);
      request.user = {
        sub: user.id,
        email,
        subscriptionPlan,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('La sesión ya no es válida');
    }
  }

  private createCognitoVerifier() {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;
    if (!userPoolId || !clientId) return undefined;
    return CognitoJwtVerifier.create({
      userPoolId,
      clientId,
      tokenUse: 'id',
    });
  }

  private bearerToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Inicia sesión para continuar');
    }
    return token;
  }
}
