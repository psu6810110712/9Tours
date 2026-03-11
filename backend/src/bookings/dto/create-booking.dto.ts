import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import {
  CUSTOMER_NAME_REGEX,
  CUSTOMER_PREFIXES,
  THAI_MOBILE_PHONE_REGEX,
  type CustomerPrefix,
  normalizeEmail,
  normalizeThaiPhoneInput,
  sanitizeCustomerName,
} from '../../users/customer-profile.utils';

function normalizePhoneForValidation(value: unknown) {
  return normalizeThaiPhoneInput(value) ?? (typeof value === 'string' ? value.trim() : '');
}

export class CreateBookingDto {
  @Type(() => Number)
  @IsInt()
  scheduleId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  paxCount: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults?: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  children?: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(new RegExp(`^(?:${CUSTOMER_PREFIXES.join('|')})$`), { message: 'กรุณาเลือกคำนำหน้าให้ถูกต้อง' })
  contactPrefix: CustomerPrefix;

  @Transform(({ value }) => sanitizeCustomerName(value))
  @Matches(CUSTOMER_NAME_REGEX, { message: 'ชื่อ-นามสกุลต้องมีเฉพาะตัวอักษรไทยหรืออังกฤษ และต้องมีทั้งชื่อและนามสกุล' })
  contactName: string;

  @Transform(({ value }) => normalizeEmail(value))
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  contactEmail: string;

  @Transform(({ value }) => normalizePhoneForValidation(value))
  @Matches(THAI_MOBILE_PHONE_REGEX, { message: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง' })
  contactPhone: string;

  @IsString()
  @IsOptional()
  specialRequest?: string;
}
