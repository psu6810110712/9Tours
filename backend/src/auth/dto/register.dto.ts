import { Transform } from 'class-transformer';
import { IsNotEmpty, MinLength } from 'class-validator';
import { CustomerProfileDto } from '../../users/dto/customer-profile.dto';

export class RegisterDto extends CustomerProfileDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(8, { message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' })
  @IsNotEmpty({ message: 'กรุณาระบุรหัสผ่าน' })
  password: string;
}
