import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class AdvertisingService {
  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async getActiveAds() {
    const now = new Date();
    return this.prisma.advertisingCampaign.findMany({
      where: {
        isActive: true,
        startAt: { lte: now },
        OR: [{ endAt: null }, { endAt: { gt: now } }],
      },
      select: {
        id: true,
        frequencyCap: true,
        cooldownSeconds: true,
        ads: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { id: true, title: true, mediaType: true, mediaUrl: true, clickUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listCampaigns() {
    return this.prisma.advertisingCampaign.findMany({
      include: { ads: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCampaign(userId: number, input: any) {
    const startAt = new Date(input.startAt);
    const endAt = input.endAt ? new Date(input.endAt) : null;
    if (!input.name || Number.isNaN(startAt.getTime()) || (endAt && Number.isNaN(endAt.getTime())) || (endAt && endAt <= startAt)) {
      throw new BadRequestException('Valid name, start date, and end date are required');
    }
    return this.prisma.advertisingCampaign.create({
      data: {
        name: input.name,
        startAt,
        endAt,
        isActive: input.isActive !== false,
        frequencyCap: Math.max(1, Number(input.frequencyCap) || 3),
        cooldownSeconds: Math.max(0, Number(input.cooldownSeconds) || 300),
        createdById: userId,
      },
    });
  }

  async updateCampaign(id: number, input: any) {
    const existing = await this.prisma.advertisingCampaign.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Campaign not found');
    const startAt = input.startAt ? new Date(input.startAt) : existing.startAt;
    const endAt = input.endAt === '' ? null : input.endAt ? new Date(input.endAt) : existing.endAt;
    if (Number.isNaN(startAt.getTime()) || (endAt && Number.isNaN(endAt.getTime())) || (endAt && endAt <= startAt)) {
      throw new BadRequestException('Invalid campaign dates');
    }
    return this.prisma.advertisingCampaign.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        startAt,
        endAt,
        ...(input.isActive !== undefined ? { isActive: Boolean(input.isActive) } : {}),
        ...(input.frequencyCap !== undefined ? { frequencyCap: Math.max(1, Number(input.frequencyCap)) } : {}),
        ...(input.cooldownSeconds !== undefined ? { cooldownSeconds: Math.max(0, Number(input.cooldownSeconds)) } : {}),
      },
    });
  }

  async deleteCampaign(id: number) {
    return this.prisma.advertisingCampaign.delete({ where: { id } });
  }

  async addAdvertisement(campaignId: number, input: any, file?: Express.Multer.File) {
    const campaign = await this.prisma.advertisingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    let mediaUrl = input.mediaUrl;
    const mediaType = String(input.mediaType || '').toUpperCase();
    if (!['IMAGE', 'VIDEO'].includes(mediaType)) throw new BadRequestException('Media type must be IMAGE or VIDEO');
    if (file) {
      if (mediaType === 'IMAGE' && !file.mimetype.startsWith('image/')) throw new BadRequestException('Image creative required');
      if (mediaType === 'VIDEO' && !file.mimetype.startsWith('video/')) throw new BadRequestException('Video creative required');
      const result = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${file.buffer.toString('base64')}`, {
        folder: 'fwaya-advertising',
        resource_type: mediaType === 'VIDEO' ? 'video' : 'image',
        quality: 'auto',
      });
      mediaUrl = result.secure_url;
    }
    if (!mediaUrl) throw new BadRequestException('Creative file or media URL is required');
    return this.prisma.advertisement.create({
      data: {
        campaignId,
        title: input.title || 'Sponsored advertisement',
        mediaType: mediaType as any,
        mediaUrl,
        clickUrl: input.clickUrl || null,
        sortOrder: Number(input.sortOrder) || 0,
        isActive: input.isActive !== false,
      },
    });
  }

  async updateAdvertisement(id: number, input: any) {
    return this.prisma.advertisement.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.clickUrl !== undefined ? { clickUrl: input.clickUrl || null } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: Number(input.sortOrder) || 0 } : {}),
        ...(input.isActive !== undefined ? { isActive: Boolean(input.isActive) } : {}),
      },
    });
  }

  async deleteAdvertisement(id: number) {
    return this.prisma.advertisement.delete({ where: { id } });
  }
}
