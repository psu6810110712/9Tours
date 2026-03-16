import { ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { getGoogleOAuthConfig } from '../google-oauth.config';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
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
      scope: ['email', 'profile'],
      session: false,
    };
  }
}
