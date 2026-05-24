import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AccountDeletionService {
  constructor(private prisma: PrismaService) {}

  // Request account deletion
  async requestAccountDeletion(
    userId: number,
    data: {
      reason?: string;
      retainData?: boolean;
      details?: Record<string, any>;
    },
  ) {
    throw new Error('Account deletion is not supported by the current database schema');
  }

  // Cancel account deletion
  async cancelAccountDeletion(userId: number) {
    throw new Error('Account deletion is not supported by the current database schema');
  }

  // Export user data
  async exportUserData(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        media: true,
        albums: true,
        playlists: true,
        followers: true,
        following: true,
        transactions: true,
        downloads: true,
        notifications: true,
        paymentAccounts: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prepare data export
    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        bio: user.bio,
        website: user.website,
        location: user.country,
      },
      content: {
        tracks: user.media?.length || 0,
        albums: user.albums?.length || 0,
        playlists: user.playlists?.length || 0,
      },
      social: {
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
      },
      transactions: {
        totalTransactions: user.transactions?.length || 0,
        totalEarnings: user.totalEarnings,
        walletBalance: user.walletBalance,
      },
      media: user.media || [],
      albums: user.albums || [],
      playlists: user.playlists || [],
      transactions: user.transactions || [],
      downloads: user.downloads || [],
    };

    return exportData;
  }

  // Get deletion request status
  async getDeletionStatus(userId: number) {
    return {
      hasDeletionRequest: false,
    };
  }

  // Execute account deletion (called by scheduled task)
  async executeAccountDeletion(userId: number, options: { completeData?: boolean } = {}) {
    throw new Error('Account deletion is not supported by the current database schema');
  }

  // Get all pending deletions (admin function)
  async getPendingDeletions(limit = 50) {
    return [];
  }

  // Bulk execute pending deletions (admin task)
  async executePendingDeletions() {
    return [];
  }
}
