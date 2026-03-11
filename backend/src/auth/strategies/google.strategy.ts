import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { DEFAULT_GOOGLE_CALLBACK_URL, getGoogleOAuthConfig } from '../google-oauth.config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const { clientID, clientSecret, callbackURL, isConfigured } = getGoogleOAuthConfig(configService);

    if (!isConfigured) {
      Logger.warn(
        'Google OAuth is disabled because GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL are not fully configured',
        GoogleStrategy.name,
      );
    }

    super({
      clientID: clientID ?? 'google-oauth-disabled',
      clientSecret: clientSecret ?? 'google-oauth-disabled',
      callbackURL: callbackURL ?? DEFAULT_GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const primaryEmail = profile.emails?.find((item) => item.verified)?.value
      ?? profile.emails?.[0]?.value
      ?? null;
    const displayName = profile.displayName?.trim() || primaryEmail;

    done(null, {
      email: primaryEmail?.toLowerCase() ?? null,
      name: displayName ?? null,
      providerUserId: profile.id,
    });
  }
}
