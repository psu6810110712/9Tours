import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(1)
  @IsNotEmpty()
  password: string;

  // ✅ "จดจำฉัน" — ถ้า true → cookie อยู่ 30 วัน, false → session cookie
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
