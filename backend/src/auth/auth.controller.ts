import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req, Res, UnauthorizedException } from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) { }

	// Helper: ตั้ง refresh_token เป็น HttpOnly cookie
	private setRefreshCookie(res: Response, token: string, remember: boolean) {
		res.cookie('refresh_token', token, {
			httpOnly: true,        // JS อ่านไม่ได้ → ป้องกัน XSS
			secure: false,         // dev ใช้ HTTP, production เปลี่ยนเป็น true
			sameSite: 'lax',
			path: '/',            // ส่ง cookie ไปยังทุก request
			...(remember && { maxAge: 30 * 24 * 60 * 60 * 1000 }), // 30 วัน หรือ session
		});
	}

	@Post('register')
	async register(@Body() createUserDto: CreateUserDto, @Res({ passthrough: true }) res: Response) {
		// SECURITY: Role is always set to 'customer' in the service, any role in body is ignored
		const { refresh_token, ...result } = await this.authService.register(createUserDto);
		// สมัครใหม่ → session cookie เสมอ (ไม่จำ)
		this.setRefreshCookie(res, refresh_token, false);
		return result; // ส่งกลับเฉพาะ { access_token, user }
	}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
		const { refresh_token, rememberMe, ...result } = await this.authService.login(
			loginDto.email, loginDto.password, loginDto.rememberMe ?? false,
		);
		// ตั้ง cookie ตามค่า "จดจำฉัน"
		this.setRefreshCookie(res, refresh_token, rememberMe);
		return result; // ส่งกลับเฉพาะ { access_token, user }
	}

	@UseGuards(JwtAuthGuard)
	@Get('me')
	async getMe(@Req() req: any) {
		// req.user is set by JwtAuthGuard via JwtStrategy
		return req.user;
	}

	@HttpCode(HttpStatus.OK)
	@Post('refresh')
	async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
		// อ่าน refresh_token จาก cookie (browser ส่งมาอัตโนมัติ)
		const token = req.cookies?.['refresh_token'];
		if (!token) throw new UnauthorizedException('ไม่พบ refresh token');

		const { refresh_token, ...result } = await this.authService.refreshToken(token);
		// ต่ออายุ cookie (keep same persistence)
		this.setRefreshCookie(res, refresh_token, !!req.cookies?.['refresh_token']);
		return result;
	}

	// Endpoint ใหม่: ลบ cookie ตอน logout
	@HttpCode(HttpStatus.OK)
	@Post('logout')
	async logout(@Res({ passthrough: true }) res: Response) {
		res.clearCookie('refresh_token', { path: '/' });
		res.clearCookie('refresh_token', { path: '/auth' }); // 🧹 ลบ Zombie cookie ทิ้ง
		return { message: 'ออกจากระบบสำเร็จ' };
	}
}
