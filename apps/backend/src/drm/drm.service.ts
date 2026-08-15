import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { GenerateLicenseDto } from '../media/dto/download-media.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DrmService {
  private readonly logger = new Logger(DrmService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;

  constructor(private prisma: PrismaService) {}

  async generateDeviceLicense(generateLicenseDto: GenerateLicenseDto, userId: number) {
    const { transactionId, deviceId } = generateLicenseDto;

    // Verify transaction and ownership
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { media: true },
    });

    if (!transaction || transaction.userId !== userId || transaction.status !== 'COMPLETED') {
      throw new Error('Valid transaction not found');
    }

    // Check if license already exists
const existingLicense = await this.prisma.deviceLicense.findFirst({
  where: {
    userId,
    deviceId: parseInt(deviceId),
    mediaId: transaction.mediaId ?? undefined, // <-- fix
    isActive: true,
  },
});

    if (existingLicense) {
      return existingLicense;
    }

    // Generate license key
    const licenseKey = this.generateLicenseKey();

    // Create device if not exists
    let userDevice = await this.prisma.userDevice.findFirst({
      where: {
        userId,
        deviceId: deviceId,
      },
    });

    if (!userDevice) {
      userDevice = await this.prisma.userDevice.create({
        data: {
          userId,
          deviceId: deviceId,
          deviceName: `Device-${deviceId}`,
          deviceType: 'mobile', // Use camelCase as per Prisma convention
          os: 'Unknown',
          fingerprint: `fp-${deviceId}`,
        },
      });
    }

    // Create license
const license = await this.prisma.deviceLicense.create({
  data: {
    userId,
    deviceId: userDevice.id,
    mediaId: transaction.mediaId!, // <-- fix: use non-null assertion, or check before
    transactionId,
    licenseKey,
    restrictionLevel: 'STRICT',
    isActive: true,
  },
});

    return license;
  }

  async encryptMediaFile(filePath: string, licenseKey: string): Promise<{ encryptedData: Buffer; iv: string; authTag: string }> {
    const fileBuffer = fs.readFileSync(filePath);

    // Generate random initialization vector
    const iv = randomBytes(16);

    // Generate key from license key
    const key = await promisify(scrypt)(licenseKey, 'salt', this.keyLength) as Buffer;

    const cipher = createCipheriv(this.algorithm, key, iv);

    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  async decryptMediaFile(encryptedData: Buffer, licenseKey: string, iv: string, authTag: string): Promise<Buffer> {
    const key = await promisify(scrypt)(licenseKey, 'salt', this.keyLength) as Buffer;
    const decipher = createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);

    return decrypted;
  }

  async validateLicense(mediaId: number, deviceId: string, licenseKey: string): Promise<boolean> {
    const license = await this.prisma.deviceLicense.findFirst({
      where: {
        mediaId,
        licenseKey,
        isActive: true,
        device: {
          deviceId: deviceId,
        },
      },
      include: {
        device: true,
      },
    });

    if (!license) {
      return false;
    }

    // Check if license has expired
    if (license.expiresAt && license.expiresAt < new Date()) {
      await this.prisma.deviceLicense.update({
        where: { id: license.id },
        data: { isActive: false },
      });
      return false;
    }

    return true;
  }

  async createProtectedDownload(mediaId: number, userId: number, deviceInfo: any) {
    // Check if user has valid license for this media on this device
    const license = await this.prisma.deviceLicense.findFirst({
      where: {
        mediaId,
        userId,
        device: {
          deviceId: deviceInfo.deviceId,
        },
        isActive: true,
      },
      include: {
        device: true,
        media: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              }
            }
          }
        },
      },
    });

    if (!license) {
      throw new Error('No valid license found for this device');
    }

    // Get media file path
    const media = license.media;
    if (!media) {
      throw new Error('Media not found');
    }

    // Encrypt the file for download
    const encryptedFile = await this.encryptMediaFile(media.url, license.licenseKey);

    // Create .fwaya file with metadata and player URL
    const fwayaFile = await this.createFwayaFile(
      encryptedFile.encryptedData,
      {
        version: '1.0',
        mediaId,
        licenseKey: license.licenseKey,
        deviceId: deviceInfo.deviceId,
        encryption: {
          algorithm: this.algorithm,
          iv: encryptedFile.iv,
          authTag: encryptedFile.authTag,
        },
        mediaInfo: {
          title: media.title,
          artist: media.user?.displayName || media.user?.username || 'Unknown Artist',
          duration: media.duration || 0,
          format: media.format || 'mp3',
          coverUrl: media.artCoverUrl,
        },
        playerUrl: `${process.env.PLAYER_URL || 'https://player.fwaya.com'}/player`,
        downloadedAt: new Date().toISOString(),
      }
    );

    // Create download record
    const download = await this.prisma.download.create({
      data: {
        mediaId,
        userId,
        deviceId: deviceInfo.deviceId,
        isDRMProtected: true,
        licenseKey: license.licenseKey,
        accessType: 'OFFLINE',
        extraData: {
          encryption: {
            iv: encryptedFile.iv,
            authTag: encryptedFile.authTag,
            algorithm: this.algorithm,
          },
          deviceInfo,
          fwayaFileSize: fwayaFile.length,
        },
      },
    });

    return {
      download,
      fwayaFile, // Return the complete .fwaya file buffer
      fileName: `${media.title.replace(/[^a-z0-9]/gi, '_')}.fwaya`,
      mimeType: 'application/fwaya',
    };
  }

  async streamProtectedMedia(mediaId: number, userId: number, deviceInfo: any, range?: string) {
    const isValid = await this.validateLicense(mediaId, deviceInfo.deviceId, deviceInfo.licenseKey);

    if (!isValid) {
      throw new Error('Invalid license or device');
    }

    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    // Implement secure streaming with range support
    // This would involve reading the file in chunks and serving it securely
    return this.getSecureStream(media.url, range);
  }

  private generateLicenseKey(): string {
    return `LIC-${Date.now()}-${randomBytes(16).toString('hex')}`;
  }

  private async createFwayaFile(
    encryptedData: Buffer,
    metadata: any
  ): Promise<Buffer> {
    // Create JSON metadata
    const metadataJson = JSON.stringify(metadata, null, 2);
    const separator = 'FWAYA_FILE_SEPARATOR\n';

    // Combine metadata + separator + encrypted data
    const metadataBuffer = Buffer.from(metadataJson, 'utf8');
    const separatorBuffer = Buffer.from(separator, 'utf8');

    // Create final buffer
    const totalLength = metadataBuffer.length + separatorBuffer.length + encryptedData.length;
    const fwayaFile = Buffer.alloc(totalLength);

    // Copy each part
    metadataBuffer.copy(fwayaFile, 0);
    separatorBuffer.copy(fwayaFile, metadataBuffer.length);
    encryptedData.copy(fwayaFile, metadataBuffer.length + separatorBuffer.length);

    return fwayaFile;
  }

  private async getSecureStream(filePath: string, range?: string) {
    // Implement secure streaming logic with range headers
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      const file = fs.createReadStream(filePath, { start, end });

      return {
        stream: file,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'audio/mpeg',
        },
      };
    } else {
      const file = fs.createReadStream(filePath);
      return {
        stream: file,
        headers: {
          'Content-Length': fileSize,
          'Content-Type': 'audio/mpeg',
        },
      };
    }
  }
}