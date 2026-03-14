import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AuthProvider, UserRole } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';

export interface GoogleOAuthProfile {
  email: string | null;
  name: string | null;
  providerUserId: string;
}

export interface SessionContext {
  ipAddress: string | null;
  userAgent: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async register(createUserDto: CreateUserDto, context?: SessionContext) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new BadRequestException('อีเมลนี้มีผู้ใช้แล้ว');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create new user - ใช้ role จาก DTO ถ้ามี ไม่งั้นใช้ 'customer' เป็นค่าเริ่มต้น
    const role = (createUserDto.role === 'admin' ? UserRole.ADMIN : UserRole.CUSTOMER);
    const user = await this.usersService.create({
      prefix: (createUserDto.prefix as any) || null,
      email: createUserDto.email,
      name: createUserDto.name,
      password: hashedPassword,
      role,
      phone: createUserDto.phone,
      authProvider: AuthProvider.LOCAL,
      providerUserId: null,
    }, { hashPassword: false });

    return this.generateToken(user);
  }

  async login(email: string, password: string, rememberMe: boolean = false, context?: SessionContext) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }

    // ✅ ส่ง rememberMe ไปด้วยเพื่อให้ controller ตั้งค่า cookie
    return { ...this.generateToken(user), rememberMe };
  }

  private generateToken(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        profileCompleted: Boolean(user.prefix && user.name && user.email && user.phone),
      },
    };
  }

  async refreshToken(refreshToken: string, context?: SessionContext) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return this.generateToken(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async loginWithGoogle(profile: GoogleOAuthProfile, context?: SessionContext) {
    if (!profile.email) {
      throw new BadRequestException('GOOGLE_OAUTH_EMAIL_REQUIRED');
    }
    let user = await this.usersService.findByEmail(profile.email);
    if (!user) {
      user = await this.usersService.create({
        email: profile.email,
        name: profile.name || 'Google User',
        password: '',
        role: UserRole.CUSTOMER,
        phone: '',
      });
    } else if (user.role !== UserRole.CUSTOMER) {
      throw new BadRequestException('GOOGLE_OAUTH_CUSTOMER_ONLY');
    }
    return { ...this.generateToken(user), rememberMe: true };
  }

  async getAuthenticatedUser(id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, ...result } = user as any;
    return result;
  }

  async logout(refreshToken?: string) {
    // Invalidate refresh token if stored
    return true;
  }
}
