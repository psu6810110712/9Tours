import { ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { getGoogleOAuthConfig } from '../google-oauth.config';

@Injectable()
export class GoogleOAuthCallbackGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    if (!getGoogleOAuthConfig(this.configService).isConfigured) {
      throw new ServiceUnavailableException('Google OAuth is not configured');
    }

    return super.canActivate(context);
  }

  override getAuthenticateOptions() {
    return {
      session: false,
      failureRedirect: this.buildFailureRedirectUrl(),
    };
  }

  private buildFailureRedirectUrl() {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const url = new URL('/auth/google/callback', frontendUrl);
    url.searchParams.set('status', 'error');
    url.searchParams.set('error', 'oauth_failed');
    return url.toString();
  }
}
