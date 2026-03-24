# Fwaya Music - DRM & Encryption Implementation Analysis

## Overview
Fwaya Music implements a device-bound DRM system using **AES-256-GCM** encryption for protected track downloads. The system ties encrypted content to specific devices through device licenses, preventing unauthorized copying and sharing.

---

## 1. Encryption Algorithm & Method

### Backend (Node.js/NestJS)
**Algorithm**: AES-256-GCM (Advanced Encryption Standard - 256-bit, Galois/Counter Mode)
**Key Length**: 32 bytes (256 bits)
**Implementation**: Node.js native `crypto` module

```typescript
// apps/backend/src/drm/drm.service.ts
@Injectable()
export class DrmService {
  private readonly logger = new Logger(DrmService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
```

### Frontend (Browser)
**Algorithm**: AES-GCM via WebCrypto API
**Implementation**: Browser's native Web Crypto API

```typescript
// Frontend key derivation (apps/frontend/app/library/page.tsx)
const getKey = async (deviceId: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(deviceId),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("fwaya-salt"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};
```

---

## 2. How Tracks Are Encrypted When Downloaded

### Encryption Flow (Backend)

#### Step 1: Generate Device License
When a user purchases a track, a device license is created:

```typescript
// apps/backend/src/drm/drm.service.ts
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
      mediaId: transaction.mediaId ?? undefined,
      isActive: true,
    },
  });

  if (existingLicense) {
    return existingLicense;
  }

  // Generate unique license key
  const licenseKey = this.generateLicenseKey();

  // Create device if not exists
  let userDevice = await this.prisma.userDevice.findFirst({
    where: { userId, deviceId: deviceId }
  });

  if (!userDevice) {
    userDevice = await this.prisma.userDevice.create({
      data: {
        userId,
        deviceId: deviceId,
        deviceName: `Device-${deviceId}`,
        deviceType: 'mobile',
        os: 'Unknown',
        fingerprint: `fp-${deviceId}`,
      },
    });
  }

  // Create device license
  const license = await this.prisma.deviceLicense.create({
    data: {
      userId,
      deviceId: userDevice.id,
      mediaId: transaction.mediaId!,
      transactionId,
      licenseKey,
      restrictionLevel: 'STRICT',
      isActive: true,
    },
  });

  return license;
}

private generateLicenseKey(): string {
  return `LIC-${Date.now()}-${randomBytes(16).toString('hex')}`;
}
```

#### Step 2: Encrypt Media File for Download

```typescript
// apps/backend/src/drm/drm.service.ts
async encryptMediaFile(
  filePath: string, 
  licenseKey: string
): Promise<{ encryptedData: Buffer; iv: string; authTag: string }> {
  const fileBuffer = fs.readFileSync(filePath);

  // Generate random initialization vector (IV) - 16 bytes
  const iv = randomBytes(16);

  // Derive encryption key from license key using PBKDF2-like scrypt
  const key = await promisify(scrypt)(licenseKey, 'salt', this.keyLength) as Buffer;

  // Create cipher with AES-256-GCM
  const cipher = createCipheriv(this.algorithm, key, iv);

  // Encrypt the file
  const encrypted = Buffer.concat([
    cipher.update(fileBuffer),
    cipher.final()
  ]);

  // Get authentication tag (ensures integrity)
  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),           // Hex string for transport
    authTag: authTag.toString('hex')   // Hex string for transport
  };
}
```

#### Step 3: Create Protected Download Record

```typescript
// apps/backend/src/drm/drm.service.ts
async createProtectedDownload(mediaId: number, userId: number, deviceInfo: any) {
  // Verify user has valid license for this media on this device
  const license = await this.prisma.deviceLicense.findFirst({
    where: {
      mediaId,
      userId,
      device: {
        deviceId: deviceInfo.deviceId,
      },
      isActive: true,
    },
  });

  if (!license) {
    throw new Error('No valid license found for this device');
  }

  // Get media file
  const media = await this.prisma.media.findUnique({
    where: { id: mediaId },
  });

  if (!media) {
    throw new Error('Media not found');
  }

  // Encrypt the file for download
  const encryptedFile = await this.encryptMediaFile(media.url, license.licenseKey);

  // Create download record with encryption metadata
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
      },
    },
  });

  return {
    download,
    encryptedData: encryptedFile.encryptedData,
    encryptionInfo: {
      iv: encryptedFile.iv,
      authTag: encryptedFile.authTag,
    },
  };
}
```

### Frontend Encryption (Browser)

When downloading a track on the frontend:

```typescript
// apps/frontend/app/browse/page.tsx
const handleDownload = async (file: MediaFile) => {
  try {
    // 1. Request download from backend
    const downloadResponse = await fetch(downloadData.downloadUrl);
    const blob = await downloadResponse.blob();
    
    // 2. Get device ID and derive encryption key
    const deviceId = localStorage.getItem('deviceId') || 'web-browser';
    const key = await getKey(deviceId);
    
    // 3. Encrypt file locally
    const arrayBuffer = await blob.arrayBuffer();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      arrayBuffer
    );
    const encryptedBlob = new Blob([encrypted]);

    // 4. Store encrypted data in IndexedDB
    if (db) {
      const transaction = db.transaction(["downloads"], "readwrite");
      const store = transaction.objectStore("downloads");
      const data = { encrypted: new Uint8Array(encrypted), iv };
      store.put(data, file.id);
    }

    // 5. Download encrypted file
    const url = window.URL.createObjectURL(encryptedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.title}.${file.format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    console.error('Download error:', err);
  }
};
```

---

## 3. Key Generation & Management

### Backend Key Derivation
Keys are derived from license keys using **scrypt** (memory-hard KDF):

```typescript
const key = await promisify(scrypt)(licenseKey, 'salt', 32) as Buffer;
```

**Parameters**:
- Input: `licenseKey` (e.g., "LIC-1234567890-abc123def456")
- Salt: Static value `'salt'`
- Output length: 32 bytes (256 bits)

### License Key Generation
Each device gets a unique license key:

```typescript
private generateLicenseKey(): string {
  return `LIC-${Date.now()}-${randomBytes(16).toString('hex')}`;
  // Example: LIC-1699564200000-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
}
```

### Frontend Key Derivation
Frontend uses PBKDF2 with device ID:

```typescript
const keyDerivation = await crypto.subtle.deriveKey({
  name: "PBKDF2",
  salt: encoder.encode("fwaya-salt"),
  iterations: 100000,
  hash: "SHA-256"
},
keyMaterial,
{ name: "AES-GCM", length: 256 },
true,
["encrypt", "decrypt"]
);
```

**Parameters**:
- Key material: Device ID
- Salt: `"fwaya-salt"`
- Iterations: **100,000** (PBKDF2-SHA256)
- Output: 256-bit AES-GCM key

---

## 4. File Formats & Extensions

### Storage Format
Files are stored in their **original format** but with encryption metadata:

**Supported Formats** (from Cloudinary/Media schema):
- **Audio**: MP3, WAV, FLAC, AAC, OGG, M4A
- **Video**: MP4, WebM, MOV, AVI, MKV
- **Podcast**: MP3, M4A
- **Live Stream**: HLS/DASH streams

### Original Media Model
```typescript
// apps/backend/prisma/schema.prisma
model Media {
  id           Int          @id @default(autoincrement())
  url          String       @unique          // Original file URL (Cloudinary)
  format       String?                       // File format/extension
  duration     Int?                          // Duration in seconds
  title        String
  isDRMProtected Boolean    @default(false)  // DRM flag
  encryptionKey String?                      // Optional static encryption key
  maxDevices   Int          @default(1)      // Max devices per license
  // ... other fields
}
```

### Download Record Storage
```typescript
// apps/backend/prisma/schema.prisma
model Download {
  id              Int                 @id @default(autoincrement())
  mediaId         Int
  userId          Int
  isDRMProtected  Boolean             @default(false)
  licenseKey      String?             @unique          // Unique license key
  accessType      DownloadAccessType  @default(OFFLINE) // OFFLINE/ONLINE/STREAMING
  extraData       Json?               // Stores: { encryption: {iv, authTag, algorithm}, deviceInfo }
  downloadedAt    DateTime            @default(now())
  expiresAt       DateTime?           // Optional expiration
  
  @@map("downloads")
}
```

### Frontend IndexedDB Storage
```typescript
// IndexedDB structure for downloads
{
  /* downloads store */
  id: string,                    // Media ID
  encrypted: Uint8Array,         // Encrypted audio bytes
  iv: Uint8Array,                // 12-byte IV for AES-GCM
  
  /* downloadMetadata store */
  id: string,
  title: string,
  artist: string,
  coverArt: string,
  duration: number,
  fileSize: number,
  quality: 'SD' | 'HD' | 'Lossless',
  downloadDate: string,          // ISO timestamp
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW',
  isDRMProtected: boolean,
  downloadStatus: 'pending' | 'downloading' | 'completed' | 'failed'
}
```

---

## 5. Decryption Logic

### Backend Decryption

```typescript
// apps/backend/src/drm/drm.service.ts
async decryptMediaFile(
  encryptedData: Buffer,
  licenseKey: string,
  iv: string,
  authTag: string
): Promise<Buffer> {
  // Derive key from license key
  const key = await promisify(scrypt)(licenseKey, 'salt', this.keyLength) as Buffer;
  
  // Create decipher with the same parameters
  const decipher = createDecipheriv(this.algorithm, key, Buffer.from(iv, 'hex'));

  // Set the authentication tag for integrity verification
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  // Decrypt the data
  const decrypted = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]);

  return decrypted;
}
```

### Frontend Decryption (Browser)

```typescript
// apps/frontend/app/download/page.tsx
const handlePlay = async (item: DownloadItem) => {
  try {
    // Get encryption key from device
    const deviceKey = localStorage.getItem('deviceKey');
    
    if (!deviceKey) {
      console.error('No device key found for DRM decryption');
      // Fallback to streaming
      return;
    }

    // Import the stored key
    const key = await crypto.subtle.importKey(
      'jwk',
      JSON.parse(deviceKey),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Get encrypted data from download
    const db = await indexedDB.open('fwaya-music-db', 1);
    const transaction = db.transaction(['downloads'], 'readonly');
    const store = transaction.objectStore('downloads');
    const request = store.get(item.id);
    
    request.onsuccess = async () => {
      const encryptedData = request.result.encryptedData;
      const iv = new Uint8Array(encryptedData.slice(0, 12));
      const encrypted = new Uint8Array(encryptedData.slice(12));

      // Decrypt using WebCrypto
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      );

      // Create blob and play
      const blob = new Blob([decrypted], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      playTrack({
        id: item.id,
        title: item.title,
        artist: item.artist,
        audioUrl: url
      });
    };
  } catch (error) {
    console.error('DRM decryption failed:', error);
    // Fallback to streaming without DRM decryption
  }
};
```

### Frontend IndexedDB Decryption (Library Page)

```typescript
// apps/frontend/app/library/page.tsx
const handlePlay = async (file: MediaFile) => {
  if (db) {
    const transaction = db.transaction(["downloads"], "readonly");
    const store = transaction.objectStore("downloads");
    const request = store.get(file.id);
    
    request.onsuccess = async (e: Event) => {
      if ((e.target as IDBRequest).result) {
        const data = (e.target as IDBRequest).result;
        const { encrypted, iv } = data;
        const deviceId = localStorage.getItem('deviceId') || 'web-browser';
        const key = await getKey(deviceId);
        
        try {
          // Decrypt from IndexedDB
          const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            encrypted
          );
          const decryptedBlob = new Blob([decrypted], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(decryptedBlob);
          
          playTrack({
            id: file.id,
            title: file.title,
            artist: file.artist,
            audioUrl: url,
            url: url,
            coverArt: file.coverArt,
            duration: file.duration
          });
        } catch (error) {
          console.error('Decryption failed', error);
          // Fallback to original URL
          playTrack({
            id: file.id,
            title: file.title,
            artist: file.artist,
            audioUrl: file.url,
            url: file.url,
            coverArt: file.coverArt,
            duration: file.duration
          });
        }
      }
    };
  }
};
```

---

## 6. Device Binding & Verification

### Device Model (Database)

```typescript
// apps/backend/prisma/schema.prisma
model UserDevice {
  id           Int       @id @default(autoincrement())
  userId       Int
  deviceId     String    @unique  // Unique device identifier
  deviceName   String
  deviceType   String?   // 'mobile', 'web', 'desktop'
  os           String?   // 'iOS', 'Android', 'Windows', 'macOS'
  lastActiveAt DateTime?
  fingerprint  String?   @unique  // Device fingerprint for additional security
  
  user     User            @relation(fields: [userId], references: [id])
  licenses DeviceLicense[]

  @@unique([userId, deviceId])
  @@map("user_devices")
}
```

### Device License Model

```typescript
// apps/backend/prisma/schema.prisma
model DeviceLicense {
  id               Int                    @id @default(autoincrement())
  userId           Int                    // User who owns the license
  deviceId         Int                    // Device reference (UserDevice.id)
  mediaId          Int                    // Which track is licensed
  transactionId    Int?                   // Associated purchase transaction
  licenseKey       String                 @unique // Unique per license
  restrictionLevel DeviceRestrictionLevel // NONE | BASIC | STRICT | ENCRYPTED
  expiresAt        DateTime?              // License expiration date
  isActive         Boolean                @default(true)
  
  user        User         @relation(fields: [userId], references: [id])
  device      UserDevice   @relation(fields: [deviceId], references: [id])
  media       Media        @relation(fields: [mediaId], references: [id])
  transaction Transaction? @relation(fields: [transactionId], references: [id])

  @@unique([userId, deviceId, mediaId]) // One license per user-device-track combo
  @@index([licenseKey])
  @@map("device_licenses")
}
```

### Device Restriction Levels

```typescript
// apps/backend/prisma/schema.prisma
enum DeviceRestrictionLevel {
  NONE        // No restrictions
  BASIC       // Can play on device
  STRICT      // Can play only on registered device
  ENCRYPTED   // Fully encrypted, requires decryption
}
```

### Device License Validation

```typescript
// apps/backend/src/drm/drm.service.ts
async validateLicense(
  mediaId: number,
  deviceId: string,
  licenseKey: string
): Promise<boolean> {
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
```

### Protected Streaming

```typescript
// apps/backend/src/drm/drm.controller.ts
@Get('stream/:mediaId')
async streamProtectedMedia(
  @Param('mediaId') mediaId: string,
  @Headers('user-id') userId: string,
  @Headers('device-id') deviceId: string,
  @Headers('license-key') licenseKey: string,
  @Query('range') range: string,
  @Res() res: Response,
) {
  const deviceInfo = { deviceId, licenseKey };
  const streamInfo = await this.drmService.streamProtectedMedia(
    parseInt(mediaId),
    parseInt(userId),
    deviceInfo,
    range,
  );

  res.set(streamInfo.headers);
  streamInfo.stream.pipe(res);
}

// apps/backend/src/drm/drm.service.ts
async streamProtectedMedia(
  mediaId: number,
  userId: number,
  deviceInfo: any,
  range?: string
) {
  // Validate license before streaming
  const isValid = await this.validateLicense(
    mediaId,
    deviceInfo.deviceId,
    deviceInfo.licenseKey
  );

  if (!isValid) {
    throw new Error('Invalid license or device');
  }

  // Get media and serve with range headers support
  const media = await this.prisma.media.findUnique({
    where: { id: mediaId },
  });

  if (!media) {
    throw new Error('Media not found');
  }

  return this.getSecureStream(media.url, range);
}

private async getSecureStream(filePath: string, range?: string) {
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
```

### Download Access Types

```typescript
// apps/backend/prisma/schema.prisma
enum DownloadAccessType {
  OFFLINE    // Can play offline (fully encrypted and stored)
  ONLINE     // Requires online validation
  STREAMING  // Streaming only (no offline capability)
}
```

---

## 7. DRM Controller Endpoints

```typescript
// apps/backend/src/drm/drm.controller.ts
@Controller('drm')
export class DrmController {
  constructor(private readonly drmService: DrmService) {}

  // Generate license after purchase
  @Post('license')
  async generateLicense(
    @Body() generateLicenseDto: GenerateLicenseDto,
    @Headers('user-id') userId: string,
  ) {
    return this.drmService.generateDeviceLicense(generateLicenseDto, parseInt(userId));
  }

  // Create protected download
  @Post('download/:mediaId')
  async createProtectedDownload(
    @Param('mediaId') mediaId: string,
    @Body() deviceInfo: any,
    @Headers('user-id') userId: string,
  ) {
    return this.drmService.createProtectedDownload(parseInt(mediaId), parseInt(userId), deviceInfo);
  }

  // Stream protected media with range support
  @Get('stream/:mediaId')
  async streamProtectedMedia(
    @Param('mediaId') mediaId: string,
    @Headers('user-id') userId: string,
    @Headers('device-id') deviceId: string,
    @Headers('license-key') licenseKey: string,
    @Query('range') range: string,
    @Res() res: Response,
  ) {
    const deviceInfo = { deviceId, licenseKey };
    const streamInfo = await this.drmService.streamProtectedMedia(
      parseInt(mediaId),
      parseInt(userId),
      deviceInfo,
      range,
    );

    res.set(streamInfo.headers);
    streamInfo.stream.pipe(res);
  }

  // Validate license
  @Get('validate/:mediaId')
  async validateLicense(
    @Param('mediaId') mediaId: string,
    @Headers('device-id') deviceId: string,
    @Headers('license-key') licenseKey: string,
  ) {
    const isValid = await this.drmService.validateLicense(parseInt(mediaId), deviceId, licenseKey);
    return { valid: isValid };
  }
}
```

---

## Security Summary

### Strengths
1. ✅ **AES-256-GCM**: Industry-standard authenticated encryption
2. ✅ **Device Binding**: Licenses tied to specific devices via unique device IDs
3. ✅ **Unique Keys**: Each license gets a unique key (`LIC-{timestamp}-{random}`)
4. ✅ **Integrity Protection**: GCM mode provides authentication tag verification
5. ✅ **Key Derivation**: Uses memory-hard scrypt (backend) and PBKDF2 (frontend)
6. ✅ **License Expiration**: Optional time-based license expiration
7. ✅ **Offline Support**: Tracks can be stored encrypted locally in IndexedDB
8. ✅ **Range/Streaming**: Supports HTTP range requests for streaming

### Current Limitations
1. ⚠️ **Static Salt**: Backend uses static salt `'salt'` for scrypt (should be per-license)
2. ⚠️ **Device Fingerprinting**: Fingerprint stored but not fully validated
3. ⚠️ **Frontend Key Storage**: Device key stored in localStorage (vulnerable to XSS)
4. ⚠️ **No License Revocation**: No mechanism to revoke already-issued licenses
5. ⚠️ **Browser-based Decryption**: Frontend decryption means key is exposed to JavaScript

### Recommendations
1. **Use per-license salts** in key derivation
2. **Store device key in secure storage** or derive it on-demand
3. **Implement license revocation** mechanism
4. **Add device fingerprinting validation** to detect device changes
5. **Consider hardware security** for high-value content
6. **Set license expiration dates** for time-limited rights

