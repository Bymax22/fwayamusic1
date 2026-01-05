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
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      
      if (!decoded.email) {
        throw new UnauthorizedException('Email is required for authentication');
      }
      
      // Find or create user in database
      let user = await this.prisma.user.findUnique({ where: { email: decoded.email } });
      
      if (!user) {
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
      }
      
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}
