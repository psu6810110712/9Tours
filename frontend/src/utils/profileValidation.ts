export const PREFIX_OPTIONS = ['นาย', 'นาง', 'นางสาว'] as const;

export type CustomerPrefix = (typeof PREFIX_OPTIONS)[number];

const NAME_REGEX = /^[A-Za-zก-๙]+(?: [A-Za-zก-๙]+)+$/u;
const PHONE_REGEX = /^0[689]\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PREFIX_PATTERN = /^(นาย|นาง|นางสาว|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|mr\.|mrs\.|ms\.|miss)\s*/iu;

export interface CustomerProfileInput {
  prefix: string;
  name: string;
  email: string;
  phone: string;
}

export interface CustomerProfileErrors {
  prefix?: string;
  name?: string;
  email?: string;
  phone?: string;
}

function trimString(value: string) {
  return value.trim();
}

export function normalizeEmail(value: string) {
  return trimString(value).toLowerCase();
}

export function sanitizeCustomerName(value: string) {
  return trimString(value).replace(/\s+/g, ' ').replace(PREFIX_PATTERN, '').trim();
}

export function normalizeThaiPhoneInput(value: string) {
  const trimmed = trimString(value);
  if (!trimmed) {
    return null;
  }

  const digitsOnly = trimmed.replace(/[^\d+]/g, '');
  if (!digitsOnly) {
    return null;
  }

  if (digitsOnly.startsWith('+66')) {
    const normalized = `0${digitsOnly.slice(3)}`.replace(/[^\d]/g, '');
    return PHONE_REGEX.test(normalized) ? normalized : null;
  }

  if (digitsOnly.startsWith('66')) {
    const normalized = `0${digitsOnly.slice(2)}`.replace(/[^\d]/g, '');
    return PHONE_REGEX.test(normalized) ? normalized : null;
  }

  const normalized = digitsOnly.replace(/[^\d]/g, '');
  return PHONE_REGEX.test(normalized) ? normalized : null;
}

export function normalizeLoginIdentifier(value: string) {
  const trimmed = trimString(value);
  if (!trimmed) {
    return '';
  }

  if (trimmed.includes('@')) {
    return normalizeEmail(trimmed);
  }

  return normalizeThaiPhoneInput(trimmed) ?? trimmed;
}

export function validateCustomerProfile(input: CustomerProfileInput): CustomerProfileErrors {
  const errors: CustomerProfileErrors = {};
  const normalizedName = sanitizeCustomerName(input.name);
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizeThaiPhoneInput(input.phone);

  if (!PREFIX_OPTIONS.includes(input.prefix as CustomerPrefix)) {
    errors.prefix = 'กรุณาเลือกคำนำหน้าให้ถูกต้อง';
  }

  if (!normalizedName) {
    errors.name = 'กรุณาระบุชื่อ-นามสกุล';
  } else if (!NAME_REGEX.test(normalizedName)) {
    errors.name = 'ชื่อ-นามสกุลต้องมีเฉพาะตัวอักษรไทยหรืออังกฤษ และต้องมีทั้งชื่อและนามสกุล';
  }

  if (!normalizedEmail) {
    errors.email = 'กรุณาระบุอีเมล';
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
  }

  if (!input.phone.trim()) {
    errors.phone = 'กรุณาระบุหมายเลขโทรศัพท์';
  } else if (!normalizedPhone) {
    errors.phone = 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง';
  }

  return errors;
}

export function validateLoginIdentifier(identifier: string) {
  const normalizedIdentifier = normalizeLoginIdentifier(identifier);
  if (!normalizedIdentifier) {
    return 'กรุณาระบุอีเมลหรือหมายเลขโทรศัพท์';
  }

  if (normalizedIdentifier.includes('@')) {
    return EMAIL_REGEX.test(normalizedIdentifier) ? undefined : 'กรุณาระบุอีเมลหรือหมายเลขโทรศัพท์ให้ถูกต้อง';
  }

  return PHONE_REGEX.test(normalizedIdentifier) ? undefined : 'กรุณาระบุอีเมลหรือหมายเลขโทรศัพท์ให้ถูกต้อง';
}

export function buildDisplayName(prefix?: string | null, name?: string | null) {
  return [prefix, name].filter(Boolean).join(' ').trim();
}
