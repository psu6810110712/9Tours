import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  @Post('register')
  async register(
    @Body() createUserDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refresh_token, rememberMe, ...result } = await this.authService.register(
      createUserDto,
      this.extractSessionContext(req),
    );
    this.setRefreshCookie(res, refresh_token, rememberMe);
    return result;
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refresh_token, rememberMe, ...result } = await this.authService.login(
      loginDto.email,
      loginDto.password,
      loginDto.rememberMe ?? false,
      this.extractSessionContext(req),
    );
    this.setRefreshCookie(res, refresh_token, rememberMe);
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request & { user: unknown }) {
    return req.user;
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[this.cookieName];
    if (!token) {
      throw new UnauthorizedException('ไม่พบ refresh token');
    }

    const { refresh_token, rememberMe, ...result } = await this.authService.refreshToken(
      token,
      this.extractSessionContext(req),
    );
    this.setRefreshCookie(res, refresh_token, rememberMe);
    return result;
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.cookies?.[this.cookieName]);
    res.clearCookie(this.cookieName, this.buildClearCookieOptions());
    return { message: 'ออกจากระบบสำเร็จ' };
  }

  private setRefreshCookie(res: Response, token: string, remember: boolean) {
    res.cookie(this.cookieName, token, this.buildRefreshCookieOptions(remember));
  }

  private buildRefreshCookieOptions(remember: boolean): CookieOptions {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const cookieDomain = this.configService.get<string>('AUTH_COOKIE_DOMAIN');
    const rememberMeDays = Number(this.configService.get<number>('REMEMBER_ME_REFRESH_TTL_DAYS') ?? 30);

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      ...(remember ? { maxAge: rememberMeDays * 24 * 60 * 60 * 1000 } : {}),
    };
  }

  private buildClearCookieOptions(): CookieOptions {
    const { maxAge: _maxAge, ...clearOptions } = this.buildRefreshCookieOptions(false);
    return clearOptions;
  }

  private extractSessionContext(req: Request) {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const ipAddress = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : xForwardedFor?.split(',')[0]?.trim() || req.ip || null;
    const userAgent = Array.isArray(req.headers['user-agent'])
      ? req.headers['user-agent'][0]
      : req.headers['user-agent'] || null;

    return { ipAddress, userAgent };
  }

  private get cookieName() {
    return this.configService.get<string>('AUTH_COOKIE_NAME') ?? 'refresh_token';
  }
}
