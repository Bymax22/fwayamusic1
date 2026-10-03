import { PrismaClient, MediaAccessType, MediaType } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

type CloudinaryResourceType = 'image' | 'video' | 'raw';

function parseResourceType(url: string, mediaType: MediaType): CloudinaryResourceType {
  const match = url.match(/\/(image|video|raw)\/(?:upload|authenticated|private)\//);
  if (match) return match[1] as CloudinaryResourceType;
  return mediaType === MediaType.PODCAST ? 'raw' : 'video';
}

function isCloudinaryNotFound(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'http_code' in error &&
    error.http_code === 404
  );
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (apply && process.env.CONFIRM_PROTECTED_MEDIA_MIGRATION !== 'yes') {
    throw new Error(
      'Set CONFIRM_PROTECTED_MEDIA_MIGRATION=yes to confirm CDN invalidation and media migration.'
    );
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret || !process.env.DATABASE_URL) {
    throw new Error('Cloudinary credentials and DATABASE_URL must be configured.');
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  const prisma = new PrismaClient();
  let failed = 0;
  let migrated = 0;

  try {
    const mediaItems = await prisma.media.findMany({
      where: {
        accessType: { in: [MediaAccessType.PREMIUM, MediaAccessType.PAY_PER_VIEW] },
      },
      select: {
        id: true,
        title: true,
        url: true,
        format: true,
        type: true,
        cloudinaryPublicId: true,
      },
      orderBy: { id: 'asc' },
    });

    console.log(
      `${apply ? 'APPLY' : 'DRY RUN'}: ${mediaItems.length} protected media record(s) found.`
    );
    for (const media of mediaItems) {
      if (!media.cloudinaryPublicId) {
        console.error(`SKIP ${media.id}: Cloudinary public ID is missing.`);
        failed += 1;
        continue;
      }

      const resourceType = parseResourceType(media.url, media.type);
      const protectedPublicId = `fwaya-protected/media-${media.id}`;
      console.log(
        `${apply ? 'MIGRATE' : 'WOULD MIGRATE'} ${media.id}: ${media.cloudinaryPublicId} -> ${protectedPublicId} (${resourceType})`
      );
      if (!apply) continue;

      try {
        let resource: { version: number };
        try {
          resource = await cloudinary.api.resource(protectedPublicId, {
            resource_type: resourceType,
            type: 'authenticated',
          });
        } catch (error) {
          if (!isCloudinaryNotFound(error)) throw error;
          resource = await cloudinary.uploader.rename(
            media.cloudinaryPublicId,
            protectedPublicId,
            {
              resource_type: resourceType,
              type: 'upload',
              to_type: 'authenticated',
              invalidate: true,
            }
          );
        }

        const protectedUrl = cloudinary.url(protectedPublicId, {
          resource_type: resourceType,
          type: 'authenticated',
          secure: true,
          version: resource.version,
          ...(media.format ? { format: media.format } : {}),
        });
        await prisma.media.update({
          where: { id: media.id },
          data: {
            cloudinaryPublicId: protectedPublicId,
            url: protectedUrl,
          },
        });
        migrated += 1;
      } catch (error) {
        failed += 1;
        console.error(
          `FAILED ${media.id}:`,
          error instanceof Error ? error.message : error
        );
      }
    }

    console.log(`${apply ? 'Migrated' : 'Planned'}: ${apply ? migrated : mediaItems.length - failed}; failed/skipped: ${failed}.`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('Protected media migration did not complete:', error);
  process.exitCode = 1;
});
