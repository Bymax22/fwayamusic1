
// src/auth/auth.controller.ts
import { Controller, Post, Body, Req, UseGuards, Get, HttpException, HttpStatus, Query, Res } from '@nestjs/common';
import { Response } from 'express';
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
    try {
      const result = await this.authService.register(dto);
      return result;
    } catch (error) {
      console.error('Signup endpoint error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create user';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('social-login')
  async socialLogin(@Body() dto: { email: string; displayName?: string; provider: string; avatarUrl?: string }) {
    return this.authService.socialLogin(dto);
  }

  @Post('send-otp')
  async sendOtp(@Body() body: { method: 'email' | 'phone' | 'link'; identifier: string }) {
    const { method, identifier } = body;
    return this.authService.sendOtp(identifier, method as any);
  }

  // Magic link verification endpoint - unauthenticated
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Query('redirect') redirect: string | undefined, @Res() res: Response) {
    if (!token) {
      return res.status(400).send('Missing token');
    }

    try {
      const result = await this.authService.verifyEmailToken(token);
      // Always use the custom domain for redirects
      const frontend = 'https://fwaya.net';
      const safeRedirect = redirect && redirect.startsWith('/') ? `${frontend}${redirect}` : `${frontend}/for-artists`;

      if (!result.success) {
        // Redirect to a friendly error page or show message
        return res.redirect(`${frontend}/auth/verify-failed`);
      }

      return res.redirect(safeRedirect);
    } catch (err) {
      console.error('verify-email error', err);
      return res.redirect(`https://fwaya.net/auth/verify-failed`);
    }
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
