import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../entities/user.entity';
import { CUSTOMER_PREFIXES, type CustomerPrefix } from '../customer-profile.utils';

export class CreateUserDto {
  @IsOptional()
<<<<<<< HEAD
  @IsIn(CUSTOMER_PREFIXES, { message: 'Prefix must be one of the allowed values' })
  prefix?: CustomerPrefix;
=======
  prefix?: "นาย" | "นาง" | "นางสาว" | null;
>>>>>>> 63ebce77a09ad42725797553798b1a337b004934

  @IsString()
  @IsNotEmpty({ message: 'กรุณาระบุชื่อ-นามสกุล' })
  name: string;

  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  @IsNotEmpty({ message: 'กรุณาระบุอีเมล' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' })
  @IsNotEmpty({ message: 'กรุณาระบุรหัสผ่าน' })
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsIn(['admin', 'customer'], { message: 'Role ต้องเป็น admin หรือ customer' })
  @Transform(({ value }) => value as UserRole | undefined)
  role?: UserRole;
}
