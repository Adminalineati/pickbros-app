import { SubscriptionPlan } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const STRONG_PASSWORD =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,72}$/;
const E164_PHONE = /^\+[1-9]\d{7,14}$/;

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  nombre!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  apellido!: string;

  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  correo!: string;

  @IsString()
  @Matches(STRONG_PASSWORD, {
    message:
      'La contraseña debe tener 12 caracteres e incluir mayúscula, minúscula, número y símbolo',
  })
  password!: string;

  @IsDateString({ strict: true })
  fechaNacimiento!: string;

  @Matches(E164_PHONE, {
    message: 'El teléfono debe incluir código de país, por ejemplo +525512345678',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  telefono!: string;

  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, { message: 'El país debe usar código ISO de dos letras' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  pais!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  estado!: string;

  @IsEnum(SubscriptionPlan)
  suscripcion!: SubscriptionPlan;
}

export class LoginDto {
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  correo!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class EmailDto {
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  correo!: string;
}

export class VerifyEmailDto extends EmailDto {
  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos' })
  codigo!: string;
}

export class ResetPasswordDto extends VerifyEmailDto {
  @IsString()
  @Matches(STRONG_PASSWORD, {
    message:
      'La contraseña debe tener 12 caracteres e incluir mayúscula, minúscula, número y símbolo',
  })
  password!: string;
}
