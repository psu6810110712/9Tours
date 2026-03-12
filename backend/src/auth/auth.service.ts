import { Injectable, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import type { StringValue } from 'ms';
import { UsersService } from '../users/users.service';
import { AuthProvider, User, UserRole } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { RefreshSession } from './entities/refresh-session.entity';
import { normalizeEmail } from '../users/customer-profile.utils';

export interface SessionRequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface GoogleOAuthProfile {
  email: string | null;
  name: string | null;
  providerUserId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshSession)
    private refreshSessionsRepository: Repository<RefreshSession>,
  ) { }

  async register(createUserDto: RegisterDto, context?: SessionRequestContext) {
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('อีเมลนี้มีผู้ใช้แล้ว');
    }

    const user = await this.usersService.create({
      prefix: createUserDto.prefix,
      email: createUserDto.email,
      name: createUserDto.name,
      password: createUserDto.password,
      role: UserRole.CUSTOMER,
      phone: createUserDto.phone,
      authProvider: AuthProvider.LOCAL,
      providerUserId: null,
    }, { hashPassword: true });

    return this.issueTokensForUser(user, { ...context, rememberMe: false });
  }

  async login(
    identifier: string,
    password: string,
    rememberMe: boolean = false,
    context?: SessionRequestContext,
  ) {
    const user = await this.findUserForLoginIdentifier(identifier);
    if (!user || !user.password) {
      throw new UnauthorizedException('อีเมลหรือหมายเลขโทรศัพท์หรือรหัสผ่านไม่ถูกต้อง');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('อีเมลหรือหมายเลขโทรศัพท์หรือรหัสผ่านไม่ถูกต้อง');
    }

    return this.issueTokensForUser(user, { ...context, rememberMe });
  }

  async loginWithGoogle(profile: GoogleOAuthProfile, context?: SessionRequestContext) {
    const email = profile.email?.trim().toLowerCase() ?? null;
    if (!email) {
      throw new BadRequestException('GOOGLE_OAUTH_EMAIL_REQUIRED');
    }

    if (!profile.providerUserId) {
      throw new UnauthorizedException('GOOGLE_OAUTH_FAILED');
    }

    let user = await this.usersService.findByProviderUserId(profile.providerUserId);

    if (!user) {
      user = await this.usersService.findByEmail(email);
    }

    if (!user) {
      user = await this.usersService.create({
        prefix: null,
        email,
        name: profile.name?.trim() || email,
        password: null,
        role: UserRole.CUSTOMER,
        phone: null,
        authProvider: AuthProvider.GOOGLE,
        providerUserId: profile.providerUserId,
      });
      return this.issueTokensForUser(user, { ...context, rememberMe: false });
    }

    if (user.role !== UserRole.CUSTOMER) {
      throw new ForbiddenException('GOOGLE_OAUTH_CUSTOMER_ONLY');
    }

    if (user.providerUserId && user.providerUserId !== profile.providerUserId) {
      throw new UnauthorizedException('GOOGLE_OAUTH_FAILED');
    }

    if (user.authProvider !== AuthProvider.GOOGLE || user.providerUserId !== profile.providerUserId) {
      user.authProvider = AuthProvider.GOOGLE;
      user.providerUserId = profile.providerUserId;
      user = await this.usersService.save(user);
    }

    return this.issueTokensForUser(user, { ...context, rememberMe: false });
  }

  async getAuthenticatedUser(userId: string) {
    const user = await this.usersService.findOne(userId);
    return this.usersService.toPublicUser(user);
  }

  async refreshToken(refreshToken: string, context?: SessionRequestContext) {
    const now = new Date();
    const hashedToken = this.hashToken(refreshToken);

    return this.refreshSessionsRepository.manager.transaction(async (manager) => {
      const refreshSessionsRepo = manager.getRepository(RefreshSession);
      const currentSession = await refreshSessionsRepo.findOne({
        where: { tokenHash: hashedToken },
        relations: ['user'],
      });

      if (!currentSession) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (currentSession.revokedAt) {
        await this.revokeSessionFamily(refreshSessionsRepo, currentSession.sessionFamily, now);
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      if (currentSession.expiresAt <= now) {
        currentSession.revokedAt = currentSession.revokedAt ?? now;
        currentSession.lastUsedAt = now;
        await refreshSessionsRepo.save(currentSession);
        throw new UnauthorizedException('Refresh token has expired');
      }

      if (!currentSession.user) {
        throw new UnauthorizedException('User not found');
      }

      const replacementRawToken = this.generateRefreshToken();
      const replacementSession = refreshSessionsRepo.create({
        userId: currentSession.userId,
        tokenHash: this.hashToken(replacementRawToken),
        sessionFamily: currentSession.sessionFamily,
        userAgent: context?.userAgent ?? currentSession.userAgent,
        ipAddress: context?.ipAddress ?? currentSession.ipAddress,
        isPersistent: currentSession.isPersistent,
        expiresAt: this.buildRefreshSessionExpiry(currentSession.isPersistent),
        lastUsedAt: now,
      });
      const savedReplacementSession = await refreshSessionsRepo.save(replacementSession);

      currentSession.revokedAt = now;
      currentSession.lastUsedAt = now;
      currentSession.rotatedToSessionId = savedReplacementSession.id;
      await refreshSessionsRepo.save(currentSession);

      return {
        access_token: this.createAccessToken(currentSession.user),
        refresh_token: replacementRawToken,
        rememberMe: currentSession.isPersistent,
        user: this.usersService.toPublicUser(currentSession.user),
      };
    });
  }

  async logout(refreshToken?: string | null) {
    if (!refreshToken) {
      return;
    }

    const session = await this.refreshSessionsRepository.findOne({
      where: { tokenHash: this.hashToken(refreshToken) },
    });

    if (!session || session.revokedAt) {
      return;
    }

    session.revokedAt = new Date();
    session.lastUsedAt = new Date();
    await this.refreshSessionsRepository.save(session);
  }

  private async issueTokensForUser(
    user: User,
    context: SessionRequestContext & { rememberMe: boolean },
  ) {
    const { rawToken, session } = await this.createRefreshSession(user.id, context);
    return {
      access_token: this.createAccessToken(user),
      refresh_token: rawToken,
      rememberMe: session.isPersistent,
      user: this.usersService.toPublicUser(user),
    };
  }

  private async createRefreshSession(
    userId: string,
    context: SessionRequestContext & { rememberMe: boolean; sessionFamily?: string },
  ) {
    const rawToken = this.generateRefreshToken();
    const refreshSession = this.refreshSessionsRepository.create({
      userId,
      tokenHash: this.hashToken(rawToken),
      sessionFamily: context.sessionFamily ?? randomUUID(),
      userAgent: context.userAgent ?? null,
      ipAddress: context.ipAddress ?? null,
      isPersistent: context.rememberMe,
      expiresAt: this.buildRefreshSessionExpiry(context.rememberMe),
      lastUsedAt: new Date(),
    });

    const session = await this.refreshSessionsRepository.save(refreshSession);
    return { rawToken, session };
  }

  private createAccessToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload, { expiresIn: this.accessTokenTtl });
  }

  private buildRefreshSessionExpiry(isPersistent: boolean) {
    const expiresAt = new Date();
    const ttlDays = isPersistent ? this.rememberMeRefreshTtlDays : this.refreshTokenTtlDays;
    expiresAt.setDate(expiresAt.getDate() + ttlDays);
    return expiresAt;
  }

  private async revokeSessionFamily(
    repository: Repository<RefreshSession>,
    sessionFamily: string,
    revokedAt: Date,
  ) {
    await repository
      .createQueryBuilder()
      .update(RefreshSession)
      .set({ revokedAt, lastUsedAt: revokedAt })
      .where('session_family = :sessionFamily', { sessionFamily })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  private async findUserForLoginIdentifier(identifier: string) {
    if (identifier.includes('@')) {
      return this.usersService.findByEmail(normalizeEmail(identifier));
    }

    return this.usersService.findByPhone(identifier);
  }

  private generateRefreshToken() {
    return randomBytes(48).toString('base64url');
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private get accessTokenTtl() {
    return (this.configService.get<string>('ACCESS_TOKEN_TTL') ?? '15m') as StringValue;
  }

  private get refreshTokenTtlDays() {
    return Number(this.configService.get<number>('REFRESH_TOKEN_TTL_DAYS') ?? 7);
  }

  private get rememberMeRefreshTtlDays() {
    return Number(this.configService.get<number>('REMEMBER_ME_REFRESH_TTL_DAYS') ?? 30);
  }
}
