import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const baseConfig = {
    JWT_SECRET: 'dev-secret',
    CORS_ORIGINS: 'http://localhost:5173',
  };

  it('allows the app to start without Google OAuth variables', () => {
    const result = validateEnv(baseConfig);

    expect(result.FRONTEND_URL).toBe('http://localhost:5173');
    expect(result.GOOGLE_CLIENT_ID).toBeUndefined();
    expect(result.GOOGLE_CLIENT_SECRET).toBeUndefined();
    expect(result.GOOGLE_CALLBACK_URL).toBeUndefined();
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
});
