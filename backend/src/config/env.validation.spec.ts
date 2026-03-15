import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const baseConfig = {
    JWT_SECRET: 'dev-secret',
    CORS_ORIGINS: 'http://localhost:5173',
  };

  it('allows the app to start without Google OAuth variables', () => {
    const result = validateEnv(baseConfig);

    expect(result.FRONTEND_URL).toBe('http://localhost:5173');
    expect(result.BACKEND_PUBLIC_URL).toBe('http://localhost:3000');
    expect(result.DB_SYNCHRONIZE).toBe(true);
    expect(result.MAIL_ENABLED).toBe(true);
    expect(result.ENABLE_TOUR_JSON_IMPORT).toBe(true);
    expect(result.GOOGLE_CLIENT_ID).toBeUndefined();
    expect(result.GOOGLE_CLIENT_SECRET).toBeUndefined();
    expect(result.GOOGLE_CALLBACK_URL).toBeUndefined();
    expect(result.PROMPTPAY_ID).toBeUndefined();
    expect(result.PROMPTPAY_ACCOUNT_NAME).toBeUndefined();
  });

  it('rejects partially configured Google OAuth variables', () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        GOOGLE_CLIENT_ID: 'client-id-only',
      }),
    ).toThrow(
      'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL must all be defined together',
    );
  });

  it('uses safe boolean defaults for production deploys', () => {
    const result = validateEnv({
      ...baseConfig,
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://example.com',
      FRONTEND_URL: 'https://example.com',
      BACKEND_PUBLIC_URL: 'https://example.com/api',
      UPLOADS_ROOT: '/mnt/9tours-uploads',
      DB_SYNCHRONIZE: 'false',
      MAIL_ENABLED: 'false',
      ENABLE_TOUR_JSON_IMPORT: 'false',
    });

    expect(result.DB_SYNCHRONIZE).toBe(false);
    expect(result.MAIL_ENABLED).toBe(false);
    expect(result.ENABLE_TOUR_JSON_IMPORT).toBe(false);
  });

  it('requires production deployment urls and upload root', () => {
    expect(() =>
      validateEnv({
        JWT_SECRET: 'prod-secret',
        NODE_ENV: 'production',
      }),
    ).toThrow('CORS_ORIGINS environment variable is required in production');

    expect(() =>
      validateEnv({
        ...baseConfig,
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://example.com',
      }),
    ).toThrow('FRONTEND_URL environment variable is required in production');

    expect(() =>
      validateEnv({
        ...baseConfig,
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://example.com',
        FRONTEND_URL: 'https://example.com',
      }),
    ).toThrow('BACKEND_PUBLIC_URL environment variable is required in production');
  });
});
