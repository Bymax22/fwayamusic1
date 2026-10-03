import { MediaAccessType, MediaType } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

describe('MediaService type normalization', () => {
  it('maps EP uploads to ALBUM media type', () => {
    const service = new MediaService({} as any, {} as any, {} as any, {} as any);

    const normalizedType = (service as any).normalizeMediaType('EP');

    expect(normalizedType).toBe(MediaType.ALBUM);
  });

  it('rejects missing release dates rather than inventing one', () => {
    const service = new MediaService({} as any, {} as any, {} as any, {} as any);

    expect(() => (service as any).resolveReleaseDate(undefined)).toThrow('A valid release date is required');
  });

  it('keeps explicit audio and video types intact', () => {
    const service = new MediaService({} as any, {} as any, {} as any, {} as any);

    expect((service as any).normalizeMediaType('AUDIO')).toBe(MediaType.AUDIO);
    expect((service as any).normalizeMediaType('VIDEO')).toBe(MediaType.VIDEO);
  });
});

describe('MediaService protected playback authorization', () => {
  const premiumUntil = new Date(Date.now() + 60_000);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('issues a signed authenticated URL to an active Premium member', async () => {
    const prisma = {
      media: {
        findUnique: jest.fn().mockResolvedValue({
          id: 12,
          userId: 2,
          accessType: MediaAccessType.PREMIUM,
          cloudinaryPublicId: 'fwaya-protected/track-12',
          url: 'https://res.cloudinary.com/demo/video/authenticated/v12/track.mp3',
          type: MediaType.AUDIO,
          format: 'mp3',
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ isPremium: true, premiumUntil }),
      },
      transaction: { findFirst: jest.fn() },
    };
    jest.spyOn(cloudinary, 'url').mockReturnValue('https://res.cloudinary.com/demo/authenticated.mp3');
    const service = new MediaService(prisma as any, {} as any, {} as any, {} as any);

    await expect(service.getPlaybackUrl(12, 44)).resolves.toEqual({
      url: 'https://res.cloudinary.com/demo/authenticated.mp3',
    });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 44 },
      select: { isPremium: true, premiumUntil: true },
    });
    expect(cloudinary.url).toHaveBeenCalledWith(
      'fwaya-protected/track-12',
      expect.objectContaining({ type: 'authenticated', sign_url: true }),
    );
  });

  it('denies Premium playback when the membership has expired', async () => {
    const prisma = {
      media: {
        findUnique: jest.fn().mockResolvedValue({
          id: 12,
          userId: 2,
          accessType: MediaAccessType.PREMIUM,
          cloudinaryPublicId: 'track-12',
          url: 'https://res.cloudinary.com/demo/video/authenticated/track.mp3',
          type: MediaType.AUDIO,
          format: 'mp3',
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          isPremium: true,
          premiumUntil: new Date(Date.now() - 60_000),
        }),
      },
      transaction: { findFirst: jest.fn() },
    };
    const service = new MediaService(prisma as any, {} as any, {} as any, {} as any);

    await expect(service.getPlaybackUrl(12, 44)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows pay-per-view playback only after a completed purchase', async () => {
    const prisma = {
      media: {
        findUnique: jest.fn().mockResolvedValue({
          id: 12,
          userId: 2,
          accessType: MediaAccessType.PAY_PER_VIEW,
          cloudinaryPublicId: 'track-12',
          url: 'https://res.cloudinary.com/demo/video/authenticated/track.mp3',
          type: MediaType.AUDIO,
          format: 'mp3',
        }),
      },
      user: { findUnique: jest.fn() },
      transaction: { findFirst: jest.fn().mockResolvedValue({ id: 90 }) },
    };
    jest.spyOn(cloudinary, 'url').mockReturnValue('https://res.cloudinary.com/demo/authenticated.mp3');
    const service = new MediaService(prisma as any, {} as any, {} as any, {} as any);

    await expect(service.getPlaybackUrl(12, 44)).resolves.toEqual({
      url: 'https://res.cloudinary.com/demo/authenticated.mp3',
    });
    expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
      where: { userId: 44, mediaId: 12, status: 'COMPLETED' },
      select: { id: true },
    });

    prisma.transaction.findFirst.mockResolvedValueOnce(null);
    await expect(service.getPlaybackUrl(12, 44)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects protected metadata without a Cloudinary asset ID', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          isPremium: true,
          premiumUntil,
          role: 'ARTIST',
        }),
      },
    };
    const service = new MediaService(prisma as any, {} as any, {} as any, {} as any);

    await expect(
      service.createMediaFromMetadata(44, {
        title: 'Protected audio',
        type: 'AUDIO',
        url: 'https://example.com/public.mp3',
        cloudinaryPublicId: '',
        duration: 90,
        format: 'mp3',
        resourceType: 'video',
        releaseDate: '2026-01-01',
        accessType: 'PREMIUM',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('MediaController JSON serialization', () => {
  it('serializes addedAt and createdAt dates as ISO strings', () => {
    const controller = new MediaController({} as any, {} as any, {} as any);
    const addedAt = new Date('2026-09-30T12:00:00.000Z');
    const createdAt = new Date('2026-09-29T12:00:00.000Z');

    const result = (controller as any).sanitizeForJson({ addedAt, createdAt });

    expect(result).toEqual({
      addedAt: '2026-09-30T12:00:00.000Z',
      createdAt: '2026-09-29T12:00:00.000Z',
    });
  });
});
