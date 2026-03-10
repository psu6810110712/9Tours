import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { RefreshSession } from './entities/refresh-session.entity';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleOAuthCallbackGuard } from './guards/google-oauth-callback.guard';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ session: false }),
    TypeOrmModule.forFeature([RefreshSession]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is not defined');
        }
        const accessTokenTtl = (configService.get<string>('ACCESS_TOKEN_TTL') ?? '15m') as StringValue;
        return {
          secret,
          signOptions: { expiresIn: accessTokenTtl },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GoogleAuthGuard, GoogleOAuthCallbackGuard],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
