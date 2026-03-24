# Fwaya Player SDK

A DRM-enabled audio player SDK for Fwaya Music that handles encrypted track playback with device binding and license validation.

## Features

- **AES-256-GCM Decryption**: Client-side decryption matching backend encryption
- **Device License Validation**: Ensures tracks only play on authorized devices
- **.fwaya File Support**: Custom file format with embedded metadata and player URL
- **File Association**: Automatic player opening when .fwaya files are clicked
- **PWA Support**: Installable web app with file handling capabilities

## Installation

```bash
npm install @fwaya/player-sdk
```

## Usage

### Basic Player Setup

```typescript
import { AdvancedPlayer } from '@fwaya/player-sdk'

<AdvancedPlayer
  metadata={fwayaFileMetadata}
  encryptedData={encryptedAudioBuffer}
/>
```

### File Handling

```typescript
import { parseFwayaFile, registerFwayaFileHandler } from '@fwaya/player-sdk'

// Parse .fwaya file
const { metadata, encryptedData } = await parseFwayaFile(file)

// Register file handler (PWA)
registerFwayaFileHandler()
```

### License Validation

```typescript
import { validateLicense, getDeviceInfo } from '@fwaya/player-sdk'

const deviceInfo = getDeviceInfo()
const isValid = await validateLicense(mediaId, licenseKey, deviceInfo.deviceId)
```

## File Format (.fwaya)

.fwaya files contain:
1. JSON metadata (title, artist, encryption info, player URL)
2. Separator: `FWAYA_FILE_SEPARATOR\n`
3. AES-256-GCM encrypted audio data

When clicked, the file automatically opens the player at the embedded URL.

## Development

```bash
# Build SDK
npm run build

# Run tests
npm test
```

## Architecture

- **packages/player-sdk**: Core DRM and decryption logic
- **apps/player**: Web player application
- **Backend DRM**: License generation and validation