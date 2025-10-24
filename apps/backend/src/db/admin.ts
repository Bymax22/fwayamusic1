import { Prisma } from '@prisma/client';
import {
  UserRole,
  MediaType,
  MediaAccessType,
  TransactionStatus
} from '@fwaya-music/types/enums';
import prisma from './db';

// Extended Admin Stats
export interface AdminStats {
  // User Stats
  totalUsers: number;
  totalArtists: number;
  totalResellers: number;
  totalAdmins: number;
  premiumUsers: number;
  
  // Content Stats
  totalMedia: number;
  audioCount: number;
  videoCount: number;
  podcastCount: number;
  premiumMedia: number;
  payPerViewMedia: number;
  
  // Financial Stats
  totalRevenue: number;
  pendingWithdrawals: number;
  totalCommissions: number;
  
  // Engagement Stats
  totalPlays: number;
  totalDownloads: number;
  activeUsers24h: number;
}

// Returns comprehensive admin dashboard statistics
export async function getAdminStats(): Promise<AdminStats> {
  try {
    // Execute all queries in parallel
    const [
      totalUsers,
      totalArtists,
      totalResellers,
      totalAdmins,
      premiumUsers,
      totalMedia,
      audioCount,
      videoCount,
      podcastCount,
      premiumMedia,
      payPerViewMedia,
      revenueResult,
      pendingWithdrawals,
      commissionsResult,
      playStats,
      downloadStats,
      activeUsers
    ] = await Promise.all([
      // User counts (5)
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ARTIST' } }),
      prisma.user.count({ where: { role: 'RESELLER' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { isPremium: true } }),
      
      // Media counts (6)
      prisma.media.count(),
      prisma.media.count({ where: { type: 'AUDIO' } }),
      prisma.media.count({ where: { type: 'VIDEO' } }),
      prisma.media.count({ where: { type: 'PODCAST' } }),
      prisma.media.count({ where: { accessType: 'PREMIUM' } }),
      prisma.media.count({ where: { accessType: 'PAY_PER_VIEW' } }),
      
      // Financial data (3)
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.transaction.count({
        where: { status: 'PENDING', mediaId: { not: null } },
      }),
      prisma.commission.aggregate({
        _sum: { amount: true },
      }),
      
      // Engagement data (3)
      prisma.media.aggregate({
        _sum: { playCount: true },
      }),
      prisma.media.aggregate({
        _sum: { downloadCount: true },
      }),
      prisma.user.count({
        where: { lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      // User stats
      totalUsers,
      totalArtists,
      totalResellers,
      totalAdmins,
      premiumUsers,
      
      // Content stats
      totalMedia,
      audioCount,
      videoCount,
      podcastCount,
      premiumMedia,
      payPerViewMedia,
      
      // Financial stats
      totalRevenue: revenueResult._sum?.amount ?? 0,
      pendingWithdrawals,
      totalCommissions: commissionsResult._sum?.amount ?? 0,
      
      // Engagement stats
      totalPlays: playStats._sum?.playCount ?? 0,
      totalDownloads: downloadStats._sum?.downloadCount ?? 0,
      activeUsers24h: activeUsers ?? 0,
    };
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    throw new Error('Failed to fetch admin statistics');
  }
}

// ==================== USER MANAGEMENT ====================

export async function getUsersWithPagination(
  page: number = 1,
  limit: number = 10,
  role?: UserRole
) {
  try {
    const whereClause = role ? { role } : {};
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function getUserDetails(userId: number) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        media: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        transactions: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        followers: {
          take: 5,
          include: { follower: true },
        },
        following: {
          take: 5,
          include: { following: true },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch user details:', error);
    throw new Error('Failed to fetch user details');
  }
}

// ==================== MEDIA MANAGEMENT ====================

export async function getMediaWithPagination(
  page: number = 1,
  limit: number = 10,
  type?: MediaType,
  accessType?: MediaAccessType
) {
  try {
    const whereClause = { 
      ...(type && { type }),
      ...(accessType && { accessType }) 
    };
    
    const [media, total] = await Promise.all([
      prisma.media.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
      prisma.media.count({ where: whereClause }),
    ]);

    return {
      media,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Failed to fetch media:', error);
    throw new Error('Failed to fetch media');
  }
}

export async function updateMediaAccessType(
  mediaId: number,
  accessType: MediaAccessType,
  price?: number
) {
  try {
    return await prisma.media.update({
      where: { id: mediaId },
      data: { 
        accessType,
        ...(price !== undefined && { price }) 
      },
    });
  } catch (error) {
    console.error('Failed to update media access type:', error);
    throw new Error('Failed to update media access type');
  }
}

// ==================== TRANSACTION MANAGEMENT ====================

export async function getTransactionsWithPagination(
  page: number = 1,
  limit: number = 10,
  status?: TransactionStatus
) {
  try {
    const whereClause = status ? { status } : {};
    
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          media: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw new Error('Failed to fetch transactions');
  }
}

export async function updateTransactionStatus(
  transactionId: number,
  status: TransactionStatus
) {
  try {
    return await prisma.transaction.update({
      where: { id: transactionId },
      data: { status },
    });
  } catch (error) {
    console.error('Failed to update transaction status:', error);
    throw new Error('Failed to update transaction status');
  }
}

// ==================== CONTENT MODERATION ====================

export async function getFlaggedMedia() {
  try {
    return await prisma.media.findMany({
      where: {
        OR: [
          { isExplicit: true },
          { accessType: { in: ['PREMIUM', 'PAY_PER_VIEW'] } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        interactions: {
          where: {
            liked: true,
          },
          take: 5,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch flagged media:', error);
    throw new Error('Failed to fetch flagged media');
  }
}

export async function toggleMediaExplicitStatus(mediaId: number) {
  try {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    return await prisma.media.update({
      where: { id: mediaId },
      data: { isExplicit: !media.isExplicit },
    });
  } catch (error) {
    console.error('Failed to toggle explicit status:', error);
    throw new Error('Failed to toggle explicit status');
  }
}

// ==================== FINANCIAL REPORTS ====================

export interface RevenueReport {
  date: string;
  totalRevenue: number;
  premiumRevenue: number;
  ppvRevenue: number;
  commissionsPaid: number;
}

export async function getRevenueReport(
  startDate: Date,
  endDate: Date
): Promise<RevenueReport[]> {
  try {
    // Group by day for the date range
    const results = await prisma.$queryRaw<RevenueReport[]>`
      SELECT 
        DATE_TRUNC('day', t.created_at) as date,
        SUM(t.amount) as "totalRevenue",
        SUM(CASE WHEN m.access_type = 'PREMIUM' THEN t.amount ELSE 0 END) as "premiumRevenue",
        SUM(CASE WHEN m.access_type = 'PAY_PER_VIEW' THEN t.amount ELSE 0 END) as "ppvRevenue",
        SUM(c.amount) as "commissionsPaid"
      FROM 
        transactions t
      LEFT JOIN 
        media m ON t.media_id = m.id
      LEFT JOIN 
        commissions c ON t.id = c.transaction_id
      WHERE 
        t.status = 'COMPLETED'
        AND t.created_at BETWEEN ${startDate} AND ${endDate}
      GROUP BY 
        DATE_TRUNC('day', t.created_at)
      ORDER BY 
        date ASC
    `;

    return results;
  } catch (error) {
    console.error('Failed to generate revenue report:', error);
    throw new Error('Failed to generate revenue report');
  }
}

//========GET ADMIN USERS============

export async function getAdminUsers(params?: {
  skip?: number;
  take?: number;
  where?: any;
}) {
  const { skip = 0, take = 20, where = {} } = params || {};
  
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      skip,
      take,
      where,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, totalCount };
}