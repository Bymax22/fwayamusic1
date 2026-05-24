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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if deletion request already exists
    const existingDeletion = await this.prisma.accountDeletion.findUnique({
      where: { userId },
    });

    if (existingDeletion && existingDeletion.status !== 'CANCELLED') {
      throw new BadRequestException('You already have an active deletion request');
    }

    // Create deletion request - scheduled for 30 days from now
    const scheduledFor = new Date();
    scheduledFor.setDate(scheduledFor.getDate() + 30);

    const deletion = await this.prisma.accountDeletion.create({
      data: {
        userId,
        reason: data.reason || 'USER_REQUEST',
        details: data.details || {},
        retainData: data.retainData || false,
        status: 'SCHEDULED',
        scheduledFor,
      },
    });

    // Update user status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.DELETED_PENDING,
        deletionRequestedAt: new Date(),
        deletionReason: data.reason || 'USER_REQUEST',
      },
    });

    return {
      message: 'Account deletion scheduled',
      scheduledFor,
      daysUntilDeletion: 30,
      deletion,
    };
  }

  // Cancel account deletion
  async cancelAccountDeletion(userId: number) {
    const deletion = await this.prisma.accountDeletion.findUnique({
      where: { userId },
    });

    if (!deletion) {
      throw new NotFoundException('No deletion request found');
    }

    if (deletion.status === 'COMPLETED') {
      throw new BadRequestException('Cannot cancel a completed deletion');
    }

    const updated = await this.prisma.accountDeletion.update({
      where: { id: deletion.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'User cancelled deletion request',
      },
    });

    // Restore user status
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
        deletionRequestedAt: null,
      },
    });

    return {
      message: 'Account deletion cancelled',
      updated,
    };
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
    const deletion = await this.prisma.accountDeletion.findUnique({
      where: { userId },
    });

    if (!deletion) {
      return {
        hasDeletionRequest: false,
      };
    }

    const daysUntilDeletion = deletion.scheduledFor
      ? Math.ceil((deletion.scheduledFor.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      hasDeletionRequest: true,
      status: deletion.status,
      scheduledFor: deletion.scheduledFor,
      daysUntilDeletion: Math.max(0, daysUntilDeletion),
      canCancel: deletion.status !== 'COMPLETED',
    };
  }

  // Execute account deletion (called by scheduled task)
  async executeAccountDeletion(userId: number, options: { completeData?: boolean } = {}) {
    const deletion = await this.prisma.accountDeletion.findUnique({
      where: { userId },
    });

    if (!deletion) {
      throw new NotFoundException('No deletion request found');
    }

    if (deletion.status !== 'SCHEDULED') {
      throw new BadRequestException('Deletion request is not in scheduled status');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update deletion status
    await this.prisma.accountDeletion.update({
      where: { id: deletion.id },
      data: {
        status: 'IN_PROGRESS',
      },
    });

    try {
      if (deletion.retainData) {
        // Export data before deletion
        const exportData = await this.exportUserData(userId);
        // Store export URL (would be uploaded to cloud storage in production)
        // For now, just mark that data was exported
        await this.prisma.accountDeletion.update({
          where: { id: deletion.id },
          data: {
            dataExportUrl: `/api/v1/users/${userId}/data-export`,
          },
        });
      }

      // Delete/anonymize user content
      // Soft delete all media
      await this.prisma.media.updateMany({
        where: { userId },
        data: {
          deletedAt: new Date(),
          deletionReason: 'ACCOUNT_DELETION',
        },
      });

      // Soft delete all albums
      await this.prisma.album.updateMany({
        where: { artistId: userId },
        data: {
          deletedAt: new Date(),
          deletionReason: 'ACCOUNT_DELETION',
        },
      });

      // Delete playlists
      await this.prisma.playlist.deleteMany({
        where: { userId },
      });

      // Anonymize user data
      const anonymizedUser = {
        displayName: `Deleted User ${userId}`,
        email: `deleted+${userId}@fwaya.local`,
        username: `deleted_${userId}`,
        bio: null,
        website: null,
        avatarUrl: null,
        coverImageUrl: null,
        phoneNumber: null,
        status: UserStatus.DELETED_COMPLETED,
      };

      await this.prisma.user.update({
        where: { id: userId },
        data: anonymizedUser,
      });

      // Mark deletion as completed
      await this.prisma.accountDeletion.update({
        where: { id: deletion.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      return {
        message: 'Account deletion completed',
        userId,
        completedAt: new Date(),
      };
    } catch (error) {
      // Rollback on error
      await this.prisma.accountDeletion.update({
        where: { id: deletion.id },
        data: {
          status: 'SCHEDULED', // Reset to scheduled to retry
        },
      });

      throw error;
    }
  }

  // Get all pending deletions (admin function)
  async getPendingDeletions(limit = 50) {
    const deletions = await this.prisma.accountDeletion.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          lte: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
          },
        },
      },
      take: limit,
    });

    return deletions;
  }

  // Bulk execute pending deletions (admin task)
  async executePendingDeletions() {
    const pending = await this.getPendingDeletions(100);

    const results = [];
    for (const deletion of pending) {
      try {
        const result = await this.executeAccountDeletion(deletion.userId);
        results.push({ success: true, userId: deletion.userId, ...result });
      } catch (error) {
        results.push({
          success: false,
          userId: deletion.userId,
          error: error.message,
        });
      }
    }

    return results;
  }
}
