/**
 * Handles .fwaya encrypted audio files
 */

export interface FwayaFileMetadata {
  version: string;
  mediaId: number;
  licenseKey: string;
  deviceId: string;
  encryption: {
    algorithm: string;
    iv: string;
    authTag: string;
  };
  mediaInfo: {
    title: string;
    artist: string;
    duration: number;
    format: string;
    coverUrl?: string;
  };
  playerUrl: string; // URL to open player
  downloadedAt: string;
}

/**
 * Parses .fwaya file metadata from JSON header
 */
export function parseFwayaFile(file: File): Promise<{
  metadata: FwayaFileMetadata;
  encryptedData: ArrayBuffer;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);

        // Find the separator between JSON metadata and encrypted data
        // Look for the magic bytes: FWAYA_FILE_SEPARATOR
        const separator = new TextEncoder().encode('FWAYA_FILE_SEPARATOR\n');
        let separatorIndex = -1;

        for (let i = 0; i < uint8Array.length - separator.length; i++) {
          let found = true;
          for (let j = 0; j < separator.length; j++) {
            if (uint8Array[i + j] !== separator[j]) {
              found = false;
              break;
            }
          }
          if (found) {
            separatorIndex = i;
            break;
          }
        }

        if (separatorIndex === -1) {
          throw new Error('Invalid .fwaya file format: separator not found');
        }

        // Extract JSON metadata
        const metadataBytes = uint8Array.slice(0, separatorIndex);
        const metadataJson = new TextDecoder().decode(metadataBytes);
        const metadata: FwayaFileMetadata = JSON.parse(metadataJson);

        // Extract encrypted data
        const encryptedData = arrayBuffer.slice(separatorIndex + separator.length);

        resolve({ metadata, encryptedData });
      } catch (error) {
        reject(new Error(`Failed to parse .fwaya file: ${error}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Creates a .fwaya file from encrypted data and metadata
 */
export function createFwayaFile(
  encryptedData: ArrayBuffer,
  metadata: FwayaFileMetadata
): Blob {
  const metadataJson = JSON.stringify(metadata, null, 2);
  const separator = 'FWAYA_FILE_SEPARATOR\n';

  const metadataBytes = new TextEncoder().encode(metadataJson);
  const separatorBytes = new TextEncoder().encode(separator);
  const encryptedBytes = new Uint8Array(encryptedData);

  // Combine all parts
  const totalLength = metadataBytes.length + separatorBytes.length + encryptedBytes.length;
  const combined = new Uint8Array(totalLength);

  combined.set(metadataBytes, 0);
  combined.set(separatorBytes, metadataBytes.length);
  combined.set(encryptedBytes, metadataBytes.length + separatorBytes.length);

  return new Blob([combined], { type: 'application/fwaya' });
}

/**
 * Downloads a .fwaya file to user's device
 */
export function downloadFwayaFile(
  encryptedData: ArrayBuffer,
  metadata: FwayaFileMetadata
): void {
  const blob = createFwayaFile(encryptedData, metadata);
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${metadata.mediaInfo.title.replace(/[^a-z0-9]/gi, '_')}.fwaya`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

/**
 * Registers file handler for .fwaya files (PWA)
 */
export function registerFwayaFileHandler(): void {
  if ('launchQueue' in window) {
    // File Handling API (Chrome/Edge)
    (window as any).launchQueue.setConsumer(async (launchParams: any) => {
      if (launchParams.files && launchParams.files.length > 0) {
        const file = launchParams.files[0];
        if (file.name.endsWith('.fwaya')) {
          // Handle the file - this would trigger opening the player
          window.location.href = `/player?file=${encodeURIComponent(file.name)}`;
        }
      }
    });
  }
}

/**
 * Checks if .fwaya files can be handled
 */
export function canHandleFwayaFiles(): boolean {
  return 'launchQueue' in window || 'FileReader' in window;
}