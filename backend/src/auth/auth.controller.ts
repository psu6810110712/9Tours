import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	async register(@Body() createUserDto: CreateUserDto) {
		// SECURITY: Role is always set to 'customer' in the service, any role in body is ignored
		return this.authService.register(createUserDto);
	}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	async login(@Body() loginDto: LoginDto) {
		return this.authService.login(loginDto.email, loginDto.password);
	}

	@UseGuards(JwtAuthGuard)
	@Get('me')
	async getMe(@Req() req: any) {
		// req.user is set by JwtAuthGuard via JwtStrategy
		return req.user;
	}

	@HttpCode(HttpStatus.OK)
	@Post('refresh')
	async refresh(@Body() body: { refresh_token: string }) {
		return this.authService.refreshToken(body.refresh_token);
	}
}
