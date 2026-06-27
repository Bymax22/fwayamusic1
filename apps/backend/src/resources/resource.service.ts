import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class ResourceService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async createResource(userId: number, resourceData: {
    title: string;
    description?: string;
    resourceType: 'SAMPLE' | 'LOOP' | 'TEMPLATE' | 'PRESET' | 'SOUND';
    genre?: string;
    price?: number;
    accessType?: 'FREE' | 'PREMIUM';
    fileUrl?: string;
    file?: Express.Multer.File;
    thumbnailFile?: Express.Multer.File;
  }) {
    if (!resourceData.title || !resourceData.resourceType) {
      throw new BadRequestException('Title and resource type are required');
    }

    let fileUrl = resourceData.fileUrl;
    let thumbnailUrl = null;

    if (resourceData.file) {
      fileUrl = await this.uploadToCloudinary(resourceData.file);
    }

    if (resourceData.thumbnailFile) {
      thumbnailUrl = await this.uploadToCloudinary(resourceData.thumbnailFile);
    }

    const resource = await this.prisma.resource.create({
      data: {
        title: resourceData.title,
        description: resourceData.description || '',
        resourceType: resourceData.resourceType,
        genre: resourceData.genre,
        price: resourceData.price || 0,
        accessType: resourceData.accessType || 'FREE',
        fileUrl,
        thumbnailUrl,
        userId,
        downloadCount: 0,
        playCount: 0,
        likeCount: 0
      }
    });

    return resource;
  }

  async updateResource(userId: number, resourceId: number, updateData: any, fileData?: { file?: Express.Multer.File; thumbnail?: Express.Multer.File }) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource || resource.userId !== userId) {
      throw new ForbiddenException('You can only update your own resources');
    }

    let fileUrl = resource.fileUrl;
    let thumbnailUrl = resource.thumbnailUrl;

    if (fileData?.file) {
      fileUrl = await this.uploadToCloudinary(fileData.file);
    }

    if (fileData?.thumbnail) {
      thumbnailUrl = await this.uploadToCloudinary(fileData.thumbnail);
    }

    const updated = await this.prisma.resource.update({
      where: { id: resourceId },
      data: {
        title: updateData.title !== undefined ? updateData.title : resource.title,
        description: updateData.description !== undefined ? updateData.description : resource.description,
        genre: updateData.genre !== undefined ? updateData.genre : resource.genre,
        price: updateData.price !== undefined ? updateData.price : resource.price,
        accessType: updateData.accessType !== undefined ? updateData.accessType : resource.accessType,
        fileUrl,
        thumbnailUrl
      }
    });

    return updated;
  }

  async toggleAccessType(userId: number, resourceId: number, newAccessType: 'FREE' | 'PREMIUM') {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource || resource.userId !== userId) {
      throw new ForbiddenException('You can only update your own resources');
    }

    const updated = await this.prisma.resource.update({
      where: { id: resourceId },
      data: { accessType: newAccessType }
    });

    return { message: `Resource access type changed to ${newAccessType}`, resource: updated };
  }

  async getResourceAnalytics(userId: number, resourceId: number) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource || resource.userId !== userId) {
      throw new ForbiddenException('You can only view analytics for your own resources');
    }

    const followerCount = await this.prisma.follower.count({
      where: { followingId: userId }
    });

    const totalEngagements = resource.playCount + resource.downloadCount + resource.likeCount;
    const engagementRate = resource.playCount > 0 ? ((totalEngagements / resource.playCount) * 100).toFixed(2) : '0';

    return {
      resource: {
        id: resource.id,
        title: resource.title,
        resourceType: resource.resourceType,
        genre: resource.genre,
        accessType: resource.accessType,
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt
      },
      analytics: {
        playCount: resource.playCount,
        downloadCount: resource.downloadCount,
        likeCount: resource.likeCount,
        followerCount,
        engagementRate: parseFloat(engagementRate),
        estimatedRevenue: (resource.downloadCount * resource.price * 0.7).toFixed(2)
      }
    };
  }

  async deleteResource(userId: number, resourceId: number) {
    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId }
    });

    if (!resource || resource.userId !== userId) {
      throw new ForbiddenException('You can only delete your own resources');
    }

    await this.prisma.resource.delete({
      where: { id: resourceId }
    });

    return { message: 'Resource deleted successfully' };
  }

  async getProducerResources(producerId: number, skip: number = 0, take: number = 20, type?: string) {
    const where: any = { userId: producerId };
    if (type) {
      where.resourceType = type;
    }

    return this.prisma.resource.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getAllResources(filters?: { type?: string; genre?: string; skip?: number; take?: number }) {
    const where: any = {};
    if (filters?.type) {
      where.resourceType = filters.type;
    }
    if (filters?.genre) {
      where.genre = { contains: filters.genre, mode: 'insensitive' };
    }

    return this.prisma.resource.findMany({
      where,
      skip: filters?.skip || 0,
      take: filters?.take || 20,
      orderBy: { createdAt: 'desc' }
    });
  }

  private async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'fwaya-resources',
          resource_type: 'auto',
          public_id: `${Date.now()}_${file.originalname.split('.')[0]}`,
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            reject(new BadRequestException(`Failed to upload file: ${error.message}`));
          } else {
            resolve(result.secure_url);
          }
        }
      );

      const bufferStream = Readable.from([file.buffer]);
      bufferStream.pipe(uploadStream);
    });
  }
}
