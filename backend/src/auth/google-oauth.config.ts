import { ConfigService } from '@nestjs/config';

export const DEFAULT_GOOGLE_CALLBACK_URL = 'http://localhost:3000/auth/google/callback';

export type GoogleOAuthConfig = {
  clientID?: string;
  clientSecret?: string;
  callbackURL?: string;
  isConfigured: boolean;
};

function readConfigValue(value: string | undefined) {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

export function getGoogleOAuthConfig(configService: ConfigService): GoogleOAuthConfig {
  const clientID = readConfigValue(configService.get<string>('GOOGLE_CLIENT_ID'));
  const clientSecret = readConfigValue(configService.get<string>('GOOGLE_CLIENT_SECRET'));
  const callbackURL = readConfigValue(configService.get<string>('GOOGLE_CALLBACK_URL'));

  return {
    clientID,
    clientSecret,
    callbackURL,
    isConfigured: Boolean(clientID && clientSecret && callbackURL),
  };
}
