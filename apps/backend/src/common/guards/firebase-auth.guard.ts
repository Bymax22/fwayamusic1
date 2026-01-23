import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../db/prisma.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('FirebaseAuthGuard: Missing or invalid Authorization header');
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      console.log('FirebaseAuthGuard: Verifying Firebase token, length:', token.length);
      const decoded = await admin.auth().verifyIdToken(token);
      console.log('FirebaseAuthGuard: Token verified for email:', decoded.email);
      
      if (!decoded.email) {
        console.warn('FirebaseAuthGuard: No email in decoded token');
        throw new UnauthorizedException('Email is required for authentication');
      }
      
      // Find or create user in database
      let user = await this.prisma.user.findUnique({ where: { email: decoded.email } });
      
      if (!user) {
        console.log('FirebaseAuthGuard: User not found, creating:', decoded.email);
        user = await this.prisma.user.create({
          data: {
            email: decoded.email,
            username: decoded.name?.replace(/\s+/g, '_').toLowerCase() || 'user_' + Date.now(),
            displayName: decoded.name,
            isSocialAuth: true,
            provider: 'firebase',
            role: 'USER',
            status: 'ACTIVE',
            isEmailVerified: decoded.email_verified,
            passwordHash: 'SOCIAL_LOGIN',
          },
        });
        console.log('FirebaseAuthGuard: User created:', user.id);
      }
      
      request.user = user;
      return true;
    } catch (error) {
      console.error('FirebaseAuthGuard: Token verification failed:', error instanceof Error ? error.message : error);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}

