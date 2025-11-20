
// src/auth/auth.controller.ts
import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('v1/auth') // ✅ matches /api/v1/auth/*
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signin')
  async login(@Body() dto: { email: string; password: string }) {
    return this.authService.login(dto);
  }

  @Post('signup')
  async register(@Body() dto: any) {
    // dto includes acceptedTerms, marketingEmails, etc.
    return this.authService.register(dto);
  }

  @Post('social-login')
  async socialLogin(@Body() dto: { email: string; displayName?: string; provider: string; avatarUrl?: string }) {
    return this.authService.socialLogin(dto);
  }

  @Post('send-otp')
  async sendOtp(@Body() body: { method: 'email' | 'phone'; identifier: string }) {
    const { method, identifier } = body;
    return this.authService.sendOtp(identifier, method);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('verify-otp')
  async verifyOtp(@Req() req: any, @Body() body: { method: 'email' | 'phone'; code: string }) {
    const user = req.user;
    const { method, code } = body;
    return this.authService.verifyOtp(user, method, code);
  }

  // ✅ /api/v1/auth/me - frontend calls this to sync Firebase user
  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  async getCurrentUser(@Req() req: any) {
    // FirebaseAuthGuard populates req.user
    return this.authService.findOrCreateUser(req.user);
  }
}
