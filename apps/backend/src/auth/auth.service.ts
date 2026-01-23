import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, UserRole, KYCStatus } from '@prisma/client';
import { VerificationMethod } from '@prisma/client';
import { randomBytes } from 'crypto';
import sgMail from '@sendgrid/mail';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Register a new user
   */
  async register(dto: any) {
    try {
      // Check if user already exists (might have been created by sync)
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      
      if (existingUser) {
        console.log('User already exists, updating with signup data:', existingUser.email);
        // Update user with the signup form data
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(dto.password, saltRounds);
        
        const updatedUser = await this.prisma.user.update({
          where: { email: dto.email },
          data: {
            username: dto.username,
            passwordHash,
            displayName: dto.displayName || existingUser.displayName,
            phoneNumber: dto.phoneNumber || existingUser.phoneNumber,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : existingUser.dateOfBirth,
            country: dto.country || existingUser.country,
            avatarUrl: dto.avatarUrl || existingUser.avatarUrl,
            role: dto.role || existingUser.role,
            status: existingUser.status || UserStatus.PENDING,
            acceptedTerms: dto.acceptedTerms || existingUser.acceptedTerms,
            acceptedPrivacy: dto.acceptedPrivacy || existingUser.acceptedPrivacy,
            marketingEmails: dto.marketingEmails !== undefined ? dto.marketingEmails : existingUser.marketingEmails,
            dataSharing: dto.dataSharing !== undefined ? dto.dataSharing : existingUser.dataSharing,
            consentDate: new Date(),
            // Handle address field
            address: dto.address ? (typeof dto.address === 'string' ? { street: dto.address } : dto.address) : existingUser.address,
            // Artist-specific fields
            artistName: dto.artistName || existingUser.artistName,
            stageName: dto.stageName || existingUser.stageName,
            bio: dto.bio || existingUser.bio,
            website: dto.website || existingUser.website,
            socialLinks: dto.socialLinks ? (typeof dto.socialLinks === 'string' ? JSON.parse(dto.socialLinks) : dto.socialLinks) : existingUser.socialLinks,
            // Reseller-specific fields
            businessName: dto.businessName || existingUser.businessName,
            businessType: dto.businessType || existingUser.businessType,
            taxNumber: dto.taxNumber || existingUser.taxNumber,
            taxId: dto.taxId || existingUser.taxId,
          },
        });
        
        console.log('User updated with signup data:', updatedUser.username);
        return updatedUser;
      }

      // Hash the password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(dto.password, saltRounds);

      // Prepare user data - only include fields that exist in User model
      const userData: any = {
        email: dto.email,
        username: dto.username,
        passwordHash,
        role: (dto.role as UserRole) || UserRole.USER,
        status: UserStatus.PENDING,
        isEmailVerified: false,
        isPhoneVerified: false,
        isPremium: false,
        walletBalance: 0,
        totalEarnings: 0,
        acceptedTerms: dto.acceptedTerms || false,
        acceptedPrivacy: dto.acceptedPrivacy || false,
        marketingEmails: dto.marketingEmails || false,
        dataSharing: dto.dataSharing || false,
        consentDate: new Date(),
      };

      // Add optional fields if provided
      if (dto.displayName) userData.displayName = dto.displayName;
      if (dto.phoneNumber) userData.phoneNumber = dto.phoneNumber;
      if (dto.dateOfBirth) userData.dateOfBirth = new Date(dto.dateOfBirth);
      if (dto.country) userData.country = dto.country;
      if (dto.avatarUrl) userData.avatarUrl = dto.avatarUrl;
      
      // Handle address field - convert to JSON object
      if (dto.address) {
        userData.address = typeof dto.address === 'string' 
          ? { street: dto.address } 
          : dto.address;
      }

      // Artist-specific fields
      if (dto.artistName) userData.artistName = dto.artistName;
      if (dto.stageName) userData.stageName = dto.stageName;
      if (dto.bio) userData.bio = dto.bio;
      if (dto.website) userData.website = dto.website;
      if (dto.socialLinks) {
        userData.socialLinks = typeof dto.socialLinks === 'string' ? JSON.parse(dto.socialLinks) : dto.socialLinks;
      }

      // Reseller-specific fields
      if (dto.businessName) userData.businessName = dto.businessName;
      if (dto.businessType) userData.businessType = dto.businessType;
      if (dto.taxNumber) userData.taxNumber = dto.taxNumber;
      if (dto.taxId) userData.taxId = dto.taxId;

      // Note: recaptchaToken, avatarFile, confirmPassword are not saved to database
      console.log('Creating user with role:', userData.role, 'Email:', userData.email);
      console.log('User data keys:', Object.keys(userData));
      console.log('Address field:', userData.address);
      
      const createdUser = await this.prisma.user.create({
        data: userData,
      });
      
      console.log('Created user with ID:', createdUser.id, 'Role:', createdUser.role);
      return createdUser;
    } catch (error) {
      console.error('Registration error:', error instanceof Error ? error.message : error);
      if (error instanceof Error && 'code' in error) {
        const prismaError = error as any;
        if (prismaError.code === 'P2002') {
          // User already exists - this shouldn't happen now, but handle it gracefully
          const email = prismaError.meta?.target?.[0];
          const existingUser = await this.prisma.user.findUnique({
            where: { email: email || dto.email },
          });
          if (existingUser) {
            console.log('Returning existing user due to duplicate error:', email);
            return existingUser;
          }
          throw new Error(`User with this ${email || 'field'} already exists`);
        }
      }
      throw error;
    }
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
