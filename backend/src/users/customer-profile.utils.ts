export const CUSTOMER_PREFIXES = ['นาย', 'นาง', 'นางสาว'] as const;

export type CustomerPrefix = (typeof CUSTOMER_PREFIXES)[number];

export const CUSTOMER_NAME_REGEX = /^[A-Za-zก-๙]+(?: [A-Za-zก-๙]+)+$/u;
export const THAI_MOBILE_PHONE_REGEX = /^0[689]\d{8}$/;
export const BASIC_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const LOGIN_IDENTIFIER_REGEX = /^(?:[^\s@]+@[^\s@]+\.[^\s@]+|0[689]\d{8})$/;

const PREFIX_PATTERN = /^(นาย|นาง|นางสาว|เด็กชาย|เด็กหญิง|ด\.ช\.|ด\.ญ\.|mr\.|mrs\.|ms\.|miss)\s*/iu;

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function sanitizeCustomerName(value: unknown) {
  const trimmed = trimString(value).replace(/\s+/g, ' ');
  return trimmed.replace(PREFIX_PATTERN, '').trim();
}

export function normalizeThaiPhoneInput(value: unknown) {
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
    return THAI_MOBILE_PHONE_REGEX.test(normalized) ? normalized : null;
  }

  if (digitsOnly.startsWith('66')) {
    const normalized = `0${digitsOnly.slice(2)}`.replace(/[^\d]/g, '');
    return THAI_MOBILE_PHONE_REGEX.test(normalized) ? normalized : null;
  }

  const normalized = digitsOnly.replace(/[^\d]/g, '');
  return THAI_MOBILE_PHONE_REGEX.test(normalized) ? normalized : null;
}

export function normalizeLoginIdentifier(value: unknown) {
  const trimmed = trimString(value);
  if (!trimmed) {
    return '';
  }

  if (trimmed.includes('@')) {
    return normalizeEmail(trimmed);
  }

  return normalizeThaiPhoneInput(trimmed) ?? trimmed;
}

export function isValidCustomerEmail(value: unknown) {
  return BASIC_EMAIL_REGEX.test(normalizeEmail(value));
}

export function isValidCustomerPhone(value: unknown) {
  return THAI_MOBILE_PHONE_REGEX.test(trimString(value));
}

export function isValidCustomerName(value: unknown) {
  return CUSTOMER_NAME_REGEX.test(sanitizeCustomerName(value));
}

export function isValidCustomerPrefix(value: unknown): value is CustomerPrefix {
  return CUSTOMER_PREFIXES.includes(value as CustomerPrefix);
}
