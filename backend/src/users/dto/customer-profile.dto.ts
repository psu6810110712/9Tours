import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, Matches } from 'class-validator';
import {
  CUSTOMER_NAME_REGEX,
  CUSTOMER_PREFIXES,
  THAI_MOBILE_PHONE_REGEX,
  type CustomerPrefix,
  normalizeEmail,
  normalizeThaiPhoneInput,
  sanitizeCustomerName,
} from '../customer-profile.utils';

const NAME_MESSAGE = 'ชื่อ-นามสกุลต้องมีเฉพาะตัวอักษรไทยหรืออังกฤษ และต้องมีทั้งชื่อและนามสกุล';
const PHONE_MESSAGE = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';

function normalizePhoneForValidation(value: unknown) {
  return normalizeThaiPhoneInput(value) ?? (typeof value === 'string' ? value.trim() : '');
}

export class CustomerProfileDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsIn(CUSTOMER_PREFIXES, { message: 'กรุณาเลือกคำนำหน้าให้ถูกต้อง' })
  prefix: CustomerPrefix;

  @Transform(({ value }) => sanitizeCustomerName(value))
  @IsNotEmpty({ message: 'กรุณาระบุชื่อ-นามสกุล' })
  @Matches(CUSTOMER_NAME_REGEX, { message: NAME_MESSAGE })
  name: string;

  @Transform(({ value }) => normalizeEmail(value))
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  @IsNotEmpty({ message: 'กรุณาระบุอีเมล' })
  email: string;

  @Transform(({ value }) => normalizePhoneForValidation(value))
  @IsNotEmpty({ message: 'กรุณาระบุหมายเลขโทรศัพท์' })
  @Matches(THAI_MOBILE_PHONE_REGEX, { message: PHONE_MESSAGE })
  phone: string;
}
