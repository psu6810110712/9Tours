const DEFAULT_ACCESS_TOKEN_TTL = '15m';
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 7;
const DEFAULT_REMEMBER_ME_REFRESH_TTL_DAYS = 30;
const DEFAULT_AUTH_COOKIE_NAME = 'refresh_token';
const DEFAULT_FRONTEND_URL = 'http://localhost:5173';
const DEFAULT_BACKEND_PUBLIC_URL = 'http://localhost:3000';
const DEFAULT_EASYSLIP_BASE_URL = 'https://developer.easyslip.com/api/v1';
const DEFAULT_SLIP2GO_BASE_URL = 'https://connect.slip2go.com/api';

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readPositiveInteger(value: unknown, fallback: number, variableName: string): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${variableName} must be a positive integer`);
  }

  return parsed;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }
  }

  throw new Error('Boolean environment variables must be one of true/false, 1/0, yes/no, on/off');
}

export function validateEnv(config: Record<string, unknown>) {
  const nodeEnv = readString(config.NODE_ENV) ?? 'development';
  const jwtSecret = readString(config.JWT_SECRET);
  const corsOrigins = readString(config.CORS_ORIGINS);
  const googleClientId = readString(config.GOOGLE_CLIENT_ID);
  const googleClientSecret = readString(config.GOOGLE_CLIENT_SECRET);
  const googleCallbackUrl = readString(config.GOOGLE_CALLBACK_URL);
  const frontendUrl = readString(config.FRONTEND_URL) ?? DEFAULT_FRONTEND_URL;
  const backendPublicUrl = readString(config.BACKEND_PUBLIC_URL) ?? DEFAULT_BACKEND_PUBLIC_URL;
  const configuredGoogleValues = [
    googleClientId,
    googleClientSecret,
    googleCallbackUrl,
  ].filter(Boolean).length;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  if (configuredGoogleValues > 0 && configuredGoogleValues < 3) {
    throw new Error(
      'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL must all be defined together',
    );
  }

  if (nodeEnv === 'production' && !corsOrigins) {
    throw new Error('CORS_ORIGINS environment variable is required in production');
  }

  if (nodeEnv === 'production' && !readString(config.FRONTEND_URL)) {
    throw new Error('FRONTEND_URL environment variable is required in production');
  }

  if (nodeEnv === 'production' && !readString(config.BACKEND_PUBLIC_URL)) {
    throw new Error('BACKEND_PUBLIC_URL environment variable is required in production');
  }

  if (nodeEnv === 'production' && !readString(config.UPLOADS_ROOT)) {
    throw new Error('UPLOADS_ROOT environment variable is required in production');
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    JWT_SECRET: jwtSecret,
    CORS_ORIGINS: corsOrigins,
    ACCESS_TOKEN_TTL: readString(config.ACCESS_TOKEN_TTL) ?? DEFAULT_ACCESS_TOKEN_TTL,
    REFRESH_TOKEN_TTL_DAYS: readPositiveInteger(
      config.REFRESH_TOKEN_TTL_DAYS,
      DEFAULT_REFRESH_TOKEN_TTL_DAYS,
      'REFRESH_TOKEN_TTL_DAYS',
    ),
    REMEMBER_ME_REFRESH_TTL_DAYS: readPositiveInteger(
      config.REMEMBER_ME_REFRESH_TTL_DAYS,
      DEFAULT_REMEMBER_ME_REFRESH_TTL_DAYS,
      'REMEMBER_ME_REFRESH_TTL_DAYS',
    ),
    AUTH_COOKIE_NAME: readString(config.AUTH_COOKIE_NAME) ?? DEFAULT_AUTH_COOKIE_NAME,
    AUTH_COOKIE_DOMAIN: readString(config.AUTH_COOKIE_DOMAIN),
    GOOGLE_CLIENT_ID: googleClientId,
    GOOGLE_CLIENT_SECRET: googleClientSecret,
    GOOGLE_CALLBACK_URL: googleCallbackUrl,
    FRONTEND_URL: frontendUrl,
    BACKEND_PUBLIC_URL: backendPublicUrl,
    DB_SYNCHRONIZE: readBoolean(config.DB_SYNCHRONIZE, nodeEnv !== 'production'),
    MAIL_ENABLED: readBoolean(config.MAIL_ENABLED, true),
    ENABLE_TOUR_JSON_IMPORT: readBoolean(config.ENABLE_TOUR_JSON_IMPORT, nodeEnv !== 'production'),
    UPLOADS_ROOT: readString(config.UPLOADS_ROOT),
    PROMPTPAY_ID: readString(config.PROMPTPAY_ID),
    PROMPTPAY_ACCOUNT_NAME: readString(config.PROMPTPAY_ACCOUNT_NAME),
    EASYSLIP_API_KEY: readString(config.EASYSLIP_API_KEY),
    EASYSLIP_BASE_URL: readString(config.EASYSLIP_BASE_URL) ?? DEFAULT_EASYSLIP_BASE_URL,
    SLIP2GO_API_SECRET: readString(config.SLIP2GO_API_SECRET),
    SLIP2GO_BASE_URL: readString(config.SLIP2GO_BASE_URL) ?? DEFAULT_SLIP2GO_BASE_URL,
  };
}
