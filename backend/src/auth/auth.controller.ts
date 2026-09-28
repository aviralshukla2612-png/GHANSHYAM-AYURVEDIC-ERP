import { Controller, Post, Body, Get, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    try {
      const ip = req.ip || req.socket.remoteAddress;
      return await this.authService.login(loginDto, ip);
    } catch (err: any) {
      if (err?.status && err?.status < 500) {
        throw err;
      }
      console.error('[AUTH LOGIN ERROR]', err);
      throw new UnauthorizedException(err?.message || 'Authentication failed. Please check credentials.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.id);
  }
}
