import { HttpStatus } from '@nestjs/common';
import { AccountStatus, SubscriptionPlan } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { LocalAuthService } from './local-auth.service';

describe('LocalAuthService', () => {
  const previousEnabled = process.env.LOCAL_AUTH_ENABLED;

  beforeAll(() => {
    process.env.LOCAL_AUTH_ENABLED = 'true';
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    process.env.LOCAL_AUTH_ENABLED = previousEnabled;
  });

  it('rechaza el registro de una persona menor de 18 años', async () => {
    const service = createService({ findUnique: jest.fn() });

    await expect(
      service.register({
        nombre: 'Ana',
        apellido: 'Demo',
        correo: 'ana@example.com',
        password: 'SeguraDemo2026!',
        fechaNacimiento: new Date().toISOString().slice(0, 10),
        telefono: '+525512345678',
        pais: 'MX',
        estado: 'Jalisco',
        suscripcion: SubscriptionPlan.FREE,
      }),
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      response: {
        message:
          'No pueden registrarse personas menores de 18 años ni mayores de 100 años',
      },
    });
  });

  it('rechaza el registro de una persona mayor de 100 años', async () => {
    const service = createService({ findUnique: jest.fn() });
    const tooOld = new Date();
    tooOld.setUTCFullYear(tooOld.getUTCFullYear() - 101);

    await expect(
      service.register({
        nombre: 'Ana',
        apellido: 'Demo',
        correo: 'ana@example.com',
        password: 'SeguraDemo2026!',
        fechaNacimiento: tooOld.toISOString().slice(0, 10),
        telefono: '+525512345678',
        pais: 'MX',
        estado: 'Jalisco',
        suscripcion: SubscriptionPlan.FREE,
      }),
    ).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
      response: {
        message:
          'No pueden registrarse personas menores de 18 años ni mayores de 100 años',
      },
    });
  });

  it('rechaza un correo duplicado e indica si requiere activación', async () => {
    const service = createService({
      findUnique: jest.fn(async () => ({
        email: 'ana@example.com',
        emailVerifiedAt: null,
      })),
    });

    await expect(
      service.register({
        nombre: 'Ana',
        apellido: 'Demo',
        correo: 'ana@example.com',
        password: 'SeguraDemo2026!',
        fechaNacimiento: '1990-01-01',
        telefono: '+525512345678',
        pais: 'MX',
        estado: 'Jalisco',
        suscripcion: SubscriptionPlan.FREE,
      }),
    ).rejects.toMatchObject({
      response: {
        code: 'EMAIL_DUPLICATED',
        activationRequired: true,
      },
      status: HttpStatus.CONFLICT,
    });
  });

  it('bloquea temporalmente después de tres contraseñas incorrectas', async () => {
    const user = {
      id: 'user-1',
      email: 'demo@example.com',
      displayName: 'Demo PickBro',
      firstName: 'Demo',
      lastName: 'PickBro',
      passwordHash: await hash('CorrectaDemo2026!', 4),
      subscriptionPlan: SubscriptionPlan.PREMIUM,
      accountStatus: AccountStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null as Date | null,
    };
    const update = jest.fn(
      async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(user, data);
        return user;
      },
    );
    const service = createService({
      findUnique: jest.fn(async () => user),
      update,
    });

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      await expect(
        service.login({
          correo: user.email,
          password: 'IncorrectaDemo2026!',
        }),
      ).rejects.toMatchObject({ status: HttpStatus.UNAUTHORIZED });
    }

    await expect(
      service.login({
        correo: user.email,
        password: 'IncorrectaDemo2026!',
      }),
    ).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
    expect(user.failedLoginAttempts).toBe(3);
    expect(user.lockedUntil).toBeInstanceOf(Date);
  });
});

function createService(user: Record<string, unknown>) {
  const prisma = {
    listo: true,
    user,
  } as unknown as PrismaService;
  const jwt = {
    signAsync: jest.fn(async () => 'jwt'),
  };

  return new LocalAuthService(prisma, jwt as never);
}
