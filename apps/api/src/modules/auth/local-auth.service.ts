import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { AccountStatus } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { createHmac, randomInt, randomUUID } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './auth.dto';
import type { LocalSessionUser } from './local-jwt.guard';

const MAX_FAILED_ATTEMPTS = 3;
const LOCK_MINUTES = 15;
const CODE_MINUTES = 10;
export const LOCAL_JWT = 'LOCAL_JWT';

@Injectable()
export class LocalAuthService {
  private readonly logger = new Logger(LocalAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(LOCAL_JWT)
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterDto) {
    this.assertEnabled();
    const email = input.correo;
    const birthDate = new Date(`${input.fechaNacimiento}T00:00:00.000Z`);
    this.assertAdult(birthDate);

    const [existingEmail, existingPhone] = await Promise.all([
      this.prisma.user.findUnique({ where: { email } }),
      this.prisma.user.findUnique({
        where: { phoneNumber: input.telefono },
      }),
    ]);

    if (existingEmail) {
      throw new ConflictException({
        message: 'Ya existe una cuenta con ese correo',
        code: 'EMAIL_DUPLICATED',
        activationRequired: !existingEmail.emailVerifiedAt,
        activationPath: '/verificar-correo',
      });
    }

    if (existingPhone) {
      throw new ConflictException('Ese teléfono ya está asociado a otra cuenta');
    }

    const verificationCode = this.createCode();
    const [passwordHash, verificationHash] = await Promise.all([
      hash(input.password, 12),
      Promise.resolve(this.codeHash(verificationCode)),
    ]);
    const user = await this.prisma.user.create({
      data: {
        displayName: `${input.nombre} ${input.apellido}`,
        firstName: input.nombre,
        lastName: input.apellido,
        dateOfBirth: birthDate,
        phoneNumber: input.telefono,
        country: input.pais,
        stateRegion: input.estado,
        email,
        passwordHash,
        subscriptionPlan: input.suscripcion,
        accountStatus: AccountStatus.PENDING_VERIFICATION,
        verificationHash,
        verificationEnds: this.expiresIn(CODE_MINUTES),
        username: this.usernameFromEmail(email),
        wallet: {
          create: {},
        },
      },
    });

    this.notifyEmailVerification(email, verificationCode);

    return {
      mensaje: 'Cuenta creada. Revisa tu correo para activarla.',
      requiereVerificacion: true,
      codigoDemo: this.demoCode(verificationCode),
      usuario: this.publicUser(user),
    };
  }

  async login(input: LoginDto) {
    this.assertEnabled();
    const user = await this.prisma.user.findUnique({
      where: { email: input.correo },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new HttpException(
        `Cuenta bloqueada temporalmente. Intenta nuevamente después de ${user.lockedUntil.toLocaleTimeString('es-MX')}`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!(await compare(input.password, user.passwordHash))) {
      const attempts = user.failedLoginAttempts + 1;
      const lockedUntil =
        attempts >= MAX_FAILED_ATTEMPTS
          ? this.expiresIn(LOCK_MINUTES)
          : null;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil,
        },
      });

      if (lockedUntil) {
        throw new HttpException(
          `Cuenta bloqueada durante ${LOCK_MINUTES} minutos por seguridad`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException({
        message: 'Debes verificar tu correo antes de iniciar sesión',
        code: 'EMAIL_NOT_VERIFIED',
        activationPath: '/verificar-correo',
      });
    }

    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new ForbiddenException('La cuenta está suspendida');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lastActiveAt: new Date(),
        lockedUntil: null,
      },
    });

    const payload: LocalSessionUser = {
      sub: user.id,
      email: user.email,
      subscriptionPlan: user.subscriptionPlan,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      usuario: this.publicUser(user),
    };
  }

  async verifyEmail(input: VerifyEmailDto) {
    this.assertEnabled();
    const user = await this.prisma.user.findUnique({
      where: { email: input.correo },
    });

    if (
      !user?.verificationHash ||
      !user.verificationEnds ||
      user.verificationEnds < new Date() ||
      this.codeHash(input.codigo) !== user.verificationHash
    ) {
      throw new BadRequestException('El código es inválido o ya venció');
    }

    const verified = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        accountStatus: AccountStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        verificationEnds: null,
        verificationHash: null,
      },
    });

    return {
      mensaje: 'Correo verificado correctamente',
      usuario: this.publicUser(verified),
    };
  }

  async resendVerification(input: EmailDto) {
    this.assertEnabled();
    const user = await this.prisma.user.findUnique({
      where: { email: input.correo },
    });
    let demoCode: string | undefined;

    if (user && !user.emailVerifiedAt) {
      const code = this.createCode();
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          verificationHash: this.codeHash(code),
          verificationEnds: this.expiresIn(CODE_MINUTES),
        },
      });
      this.notifyEmailVerification(user.email, code);
      demoCode = this.demoCode(code);
    }

    return {
      mensaje:
        'Si la cuenta está pendiente, enviaremos un nuevo código de verificación.',
      codigoDemo: demoCode,
    };
  }

  async requestPasswordReset(input: EmailDto) {
    this.assertEnabled();
    const user = await this.prisma.user.findUnique({
      where: { email: input.correo },
    });
    let demoCode: string | undefined;
    let phoneDestination: string | undefined;

    if (user?.phoneNumber && user.emailVerifiedAt) {
      const code = this.createCode();
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetHash: this.codeHash(code),
          passwordResetEnds: this.expiresIn(CODE_MINUTES),
        },
      });
      this.notifyPasswordReset(user.phoneNumber, code);
      demoCode = this.demoCode(code);
      phoneDestination = this.maskPhone(user.phoneNumber);
    }

    return {
      mensaje:
        'Si existe una cuenta válida, enviaremos un código al teléfono registrado.',
      telefonoDestino: phoneDestination,
      codigoDemo: demoCode,
    };
  }

  async resetPassword(input: ResetPasswordDto) {
    this.assertEnabled();
    const user = await this.prisma.user.findUnique({
      where: { email: input.correo },
    });

    if (
      !user?.passwordResetHash ||
      !user.passwordResetEnds ||
      user.passwordResetEnds < new Date() ||
      this.codeHash(input.codigo) !== user.passwordResetHash
    ) {
      throw new BadRequestException('El código es inválido o ya venció');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hash(input.password, 12),
        passwordResetHash: null,
        passwordResetEnds: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    return { mensaje: 'Contraseña actualizada correctamente' };
  }

  async profile(userId: string) {
    this.assertEnabled();
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { wallet: true },
    });

    return {
      ...this.publicUser(user),
      pickCoins: user.wallet?.pickCoins ?? 0,
      pickets: user.wallet?.pickets ?? 0,
    };
  }

  private assertEnabled() {
    const enabled =
      process.env.LOCAL_AUTH_ENABLED === 'true' ||
      process.env.NODE_ENV !== 'production';

    if (!enabled) {
      throw new ForbiddenException('El acceso local está deshabilitado');
    }

    if (!this.prisma.listo) {
      throw new ForbiddenException('La base de datos no está disponible');
    }
  }

  private publicUser(user: {
    id: string;
    displayName: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    subscriptionPlan: 'SUBS1' | 'SUBS2';
  }) {
    return {
      id: user.id,
      nombre: user.firstName ?? user.displayName,
      apellido: user.lastName ?? '',
      correo: user.email,
      suscripcion: user.subscriptionPlan.toLowerCase(),
    };
  }

  private assertAdult(birthDate: Date) {
    if (Number.isNaN(birthDate.getTime())) {
      throw new BadRequestException('La fecha de nacimiento no es válida');
    }

    const today = new Date();
    const adultLimit = new Date(
      Date.UTC(
        today.getUTCFullYear() - 18,
        today.getUTCMonth(),
        today.getUTCDate(),
      ),
    );

    if (birthDate > adultLimit) {
      throw new BadRequestException('Debes ser mayor de edad para registrarte');
    }
  }

  private createCode() {
    return randomInt(100000, 1000000).toString();
  }

  private codeHash(code: string) {
    return createHmac(
      'sha256',
      process.env.JWT_SECRET ?? 'pickbros-local-demo',
    )
      .update(code)
      .digest('hex');
  }

  private expiresIn(minutes: number) {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private demoCode(code: string) {
    return process.env.LOCAL_AUTH_EXPOSE_CODES === 'true' ? code : undefined;
  }

  private notifyEmailVerification(email: string, code: string) {
    if (process.env.LOCAL_AUTH_EXPOSE_CODES === 'true') {
      this.logger.warn(`[DEMO] Código de verificación para ${email}: ${code}`);
    }
  }

  private notifyPasswordReset(phone: string, code: string) {
    if (process.env.LOCAL_AUTH_EXPOSE_CODES === 'true') {
      this.logger.warn(`[DEMO] Código SMS para ${this.maskPhone(phone)}: ${code}`);
    }
  }

  private maskPhone(phone: string) {
    return `${phone.slice(0, 3)}••••${phone.slice(-4)}`;
  }

  private usernameFromEmail(email: string) {
    return `${email.replace(/[^a-z0-9]/g, '-')}-${randomUUID().slice(0, 8)}`;
  }
}
