import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelBookingDto {
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'เหตุผลการยกเลิกต้องไม่เกิน 500 ตัวอักษร' })
  reason?: string;
}
