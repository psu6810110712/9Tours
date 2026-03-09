const DEFAULT_ACCESS_TOKEN_TTL = '15m';
const DEFAULT_REFRESH_TOKEN_TTL_DAYS = 7;
const DEFAULT_REMEMBER_ME_REFRESH_TTL_DAYS = 30;
const DEFAULT_AUTH_COOKIE_NAME = 'refresh_token';

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

export function validateEnv(config: Record<string, unknown>) {
  const nodeEnv = readString(config.NODE_ENV) ?? 'development';
  const jwtSecret = readString(config.JWT_SECRET);
  const corsOrigins = readString(config.CORS_ORIGINS);

  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  if (nodeEnv === 'production' && !corsOrigins) {
    throw new Error('CORS_ORIGINS environment variable is required in production');
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
  };
}
