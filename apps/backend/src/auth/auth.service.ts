import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, UserRole, KYCStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Register a new user
   */
  async register(dto: any) {
    return this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash: dto.passwordHash, // should already be hashed before saving
        role: (dto.role as UserRole) || UserRole.USER,
        status: UserStatus.PENDING,
        isEmailVerified: false,
        isPhoneVerified: false,
        kycSubmissions: {}, // optional, can be removed if handled separately
        isPremium: false,
      },
    });
  }

  /**
   * Login - handled by Firebase (placeholder)
   */
  async login(dto: { email: string; password: string }) {
    return { message: 'Firebase handles login', email: dto.email };
  }

  /**
   * Social login (Google, Apple, etc.)
   */
  async socialLogin(dto: any) {
    let user = await this.prisma.user.findUnique({ where: { email: dto.email } });

if (!user) {
  user = await this.prisma.user.create({
    data: {
      email: dto.email,
      username: dto.username || dto.displayName?.replace(/\s+/g, '_').toLowerCase(),
      displayName: dto.displayName,
      avatarUrl: dto.avatarUrl,
      isSocialAuth: true,
      provider: dto.provider,
      socialId: dto.socialId,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      passwordHash: 'SOCIAL_LOGIN', // <-- Add this line
    },
  });
}

    return user;
  }

  /**
   * For Firebase user decoding or token-based login
   */
async findOrCreateUser(decodedFirebaseUser: any) {
  const email = decodedFirebaseUser.email;

  let user = await this.prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await this.prisma.user.create({
      data: {
        email,
        username:
          decodedFirebaseUser.username
          || (typeof decodedFirebaseUser.name === 'string'
              ? decodedFirebaseUser.name.replace(/\s+/g, '_').toLowerCase()
              : 'user_' + Date.now()),
        displayName: decodedFirebaseUser.name,
        isSocialAuth: true,
        provider: decodedFirebaseUser.firebase?.sign_in_provider || 'firebase',
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        isEmailVerified: decodedFirebaseUser.email_verified,
        passwordHash: 'SOCIAL_LOGIN',
      },
    });
  }

  return user;
}

  /**
   * Get profile info
   */
  async getProfile(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        createdAt: true,
      },
    });
  }
}
