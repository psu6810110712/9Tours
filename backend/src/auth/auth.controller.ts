import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	async register(@Body() createUserDto: CreateUserDto) {
		// Pass the whole DTO so role (if provided) is preserved.
		// NOTE: For security, avoid allowing public registration with the `admin` role.
		return this.authService.register(createUserDto);
	}

	@HttpCode(HttpStatus.OK)
	@Post('login')
	async login(@Body() loginDto: LoginDto) {
		return this.authService.login(loginDto.email, loginDto.password);
	}
}
