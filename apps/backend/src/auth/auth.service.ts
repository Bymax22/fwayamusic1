import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, UserRole, KYCStatus } from '@prisma/client';
import { VerificationMethod } from '@prisma/client';
import { randomBytes } from 'crypto';
import sgMail from '@sendgrid/mail';

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

  /**
   * Send OTP for a given identifier (email or phone).
   * This creates/updates a Verification record and (for now) logs the code.
   */
  async sendOtp(identifier: string, method: 'email' | 'phone') {
    // lookup user by identifier
    const user = await this.prisma.user.findUnique({ where: { email: identifier } });

    if (!user) {
      // To avoid leaking user existence, return success
      return { success: true };
    }

    // generate 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // token can be a random string used for lookup (not exposed to client here)
    const token = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // upsert verification record per user+method
    await this.prisma.verification.upsert({
      where: { userId_method: { userId: user.id, method: method === 'email' ? VerificationMethod.EMAIL : VerificationMethod.PHONE } },
      update: {
        code,
        token,
        isVerified: false,
        expiresAt,
        verifiedAt: null,
        metadata: { sentVia: method },
      },
      create: {
        userId: user.id,
        method: method === 'email' ? VerificationMethod.EMAIL : VerificationMethod.PHONE,
        code,
        token,
        expiresAt,
        metadata: { sentVia: method },
      },
    });

    // Send via email for email method, otherwise just log for phone (or integrate SMS provider)
    if (method === 'email') {
      try {
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
          console.error('SENDGRID_API_KEY not set; OTP will be logged to console instead');
        } else {
          sgMail.setApiKey(apiKey);
          const msg = {
            to: user.email,
            from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@fwayamusic.com',
            subject: 'Your Fwaya Music verification code',
            text: `Your verification code is ${code}. It expires in 10 minutes.`,
            html: `<div style="font-family: Arial, sans-serif; line-height:1.4;">
                    <h2 style="color:#0a3747">Fwaya Music Verification</h2>
                    <p>Your verification code is:</p>
                    <div style="font-size:22px; font-weight:700; margin:12px 0; color:#e51f48">${code}</div>
                    <p>This code expires in 10 minutes.</p>
                    <p>If you did not request this, please ignore this email.</p>
                   </div>`,
          } as any;

          await sgMail.send(msg);
        }
      } catch (err) {
        console.error('Failed to send OTP email via SendGrid:', err);
        // Surface a failure so frontend can react (do not silently succeed)
        throw new Error('Failed to send OTP');
      }
    } else {
      // For phone method: TODO integrate SMS provider like Twilio. For now log the code.
      console.log(`OTP for user(${user.email}) [${method}]: ${code} (expires ${expiresAt.toISOString()})`);
    }

    return { success: true };
  }

  /**
   * Verify OTP for the authenticated user
   */
  async verifyOtp(decodedFirebaseUser: any, method: 'email' | 'phone', code: string) {
    const email = decodedFirebaseUser.email;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const dbMethod = method === 'email' ? VerificationMethod.EMAIL : VerificationMethod.PHONE;
    const verification = await this.prisma.verification.findUnique({ where: { userId_method: { userId: user.id, method: dbMethod } } });

    if (!verification) return { success: false, message: 'No verification request found' };
    if (verification.isVerified) return { success: true };

    // check expiry
    const now = new Date();
    if (now > verification.expiresAt) {
      return { success: false, message: 'Code expired' };
    }

    if (verification.code !== code) {
      return { success: false, message: 'Invalid code' };
    }

    // mark verified
    await this.prisma.verification.update({ where: { id: verification.id }, data: { isVerified: true, verifiedAt: new Date() } });

    // update user flags
    if (dbMethod === VerificationMethod.EMAIL) {
      await this.prisma.user.update({ where: { id: user.id }, data: { isEmailVerified: true } });
    } else {
      await this.prisma.user.update({ where: { id: user.id }, data: { isPhoneVerified: true } });
    }

    return { success: true };
  }
}
