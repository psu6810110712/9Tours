import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { LOGIN_IDENTIFIER_REGEX, normalizeLoginIdentifier } from '../../users/customer-profile.utils';

export class LoginDto {
  @Transform(({ value }) => normalizeLoginIdentifier(value))
  @IsString()
  @IsNotEmpty({ message: 'กรุณาระบุอีเมลหรือหมายเลขโทรศัพท์' })
  @Matches(LOGIN_IDENTIFIER_REGEX, { message: 'กรุณาระบุอีเมลหรือหมายเลขโทรศัพท์ให้ถูกต้อง' })
  identifier: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
