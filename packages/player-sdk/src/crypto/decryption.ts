import { scrypt } from 'scrypt-js';

/**
 * Decrypts AES-256-GCM encrypted audio data
 * Replicates backend decryption logic for client-side playback
 */
export async function decryptAudioData(
  encryptedData: ArrayBuffer,
  licenseKey: string,
  iv: string,
  authTag: string
): Promise<ArrayBuffer> {
  try {
    // Derive key using scrypt (same as backend)
    const key = await deriveKeyScrypt(licenseKey, 'salt', 32);

    // Convert hex strings to Uint8Arrays
    const ivBuffer = hexToUint8Array(iv);
    const authTagBuffer = hexToUint8Array(authTag);

    // Combine encrypted data with auth tag
    const combinedData = new Uint8Array(encryptedData.byteLength + authTagBuffer.length);
    combinedData.set(new Uint8Array(encryptedData), 0);
    combinedData.set(authTagBuffer, encryptedData.byteLength);

    // Decrypt using WebCrypto API
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer as BufferSource,
        tagLength: 128, // 16 bytes auth tag
      },
      key,
      combinedData as BufferSource
    );

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt audio data. Invalid license or corrupted file.');
  }
}

/**
 * Derives encryption key from license key using scrypt
 * Matches backend implementation exactly
 */
export async function deriveKeyScrypt(
  licenseKey: string,
  salt: string,
  keyLength: number
): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  // Convert inputs to Uint8Arrays
  const licenseKeyBuffer = encoder.encode(licenseKey);
  const saltBuffer = encoder.encode(salt);

  // Use scrypt-js to derive key (matches backend scrypt)
  const derivedKey = await scrypt(licenseKeyBuffer, saltBuffer, 16384, 8, 1, keyLength);

  // Import as CryptoKey for WebCrypto API
  return crypto.subtle.importKey(
    'raw',
    derivedKey as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
}

/**
 * Converts hex string to Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Validates license format and basic structure
 */
export function validateLicenseKey(licenseKey: string): boolean {
  // License keys are in format: LIC-{timestamp}-{random16bytes}
  const licensePattern = /^LIC-\d+-[a-f0-9]{32}$/;
  return licensePattern.test(licenseKey);
}