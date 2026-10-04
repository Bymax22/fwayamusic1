import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { gcm } from '@noble/ciphers/aes.js';
import { fromByteArray, toByteArray } from 'base64-js';
import { Platform } from 'react-native';

export interface PrivateMobileDownload {
  id: string;
  mediaId: string;
  userId: number;
  title: string;
  artist: string;
  url: string;
  artCoverUrl: string;
  duration: number;
  genre: string;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  price: number | null;
  expiresAt: string | null;
  encrypted: boolean;
  fileUri: string;
  downloadedAt: string;
}

const DOWNLOAD_DIRECTORY = `${FileSystem.documentDirectory}fwaya-downloads/`;
const DEVICE_ID_KEY = 'fwaya.private-download.device-id';
const DEVICE_KEY = 'fwaya.private-download.aes-key';

function downloadsStorageKey(userId: number): string {
  return `fwaya-private-downloads:${userId}`;
}

function keyBytesFromHex(value: string): Uint8Array {
  if (!/^[0-9a-f]{64}$/i.test(value)) {
    throw new Error('The device download key is invalid. Remove and download this track again.');
  }
  return Uint8Array.from(value.match(/.{2}/g) || [], (byte) => Number.parseInt(byte, 16));
}

async function ensurePrivateDirectory(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DOWNLOAD_DIRECTORY);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIRECTORY, { intermediates: true });
  }
}

export async function getPrivateDownloadDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;
  const platformId = Platform.OS === 'android'
    ? Application.getAndroidId()
    : Platform.OS === 'ios'
      ? await Application.getIosIdForVendorAsync()
      : null;
  const generated = platformId
    ? `native-${Platform.OS}-${platformId}`
    : `native-${Crypto.randomUUID()}`;
  await SecureStore.setItemAsync(DEVICE_ID_KEY, generated);
  return generated;
}

async function getDeviceEncryptionKey(): Promise<Uint8Array> {
  const stored = await SecureStore.getItemAsync(DEVICE_KEY);
  if (stored) return keyBytesFromHex(stored);
  const generated = Crypto.getRandomBytes(32);
  const encoded = Array.from(generated, (byte) => byte.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(DEVICE_KEY, encoded);
  return generated;
}

function responseMessage(payload: unknown, status: number, fallback: string): string {
  if (payload && typeof payload === 'object') {
    if ('message' in payload && typeof payload.message === 'string') return payload.message;
    if ('error' in payload && typeof payload.error === 'string') return payload.error;
  }
  return `${fallback} (${status}).`;
}

export async function downloadTrackPrivately(
  track: Omit<PrivateMobileDownload, 'fileUri' | 'encrypted' | 'downloadedAt' | 'expiresAt'>,
  token: string,
  apiBaseUrl: string
): Promise<PrivateMobileDownload> {
  const deviceId = await getPrivateDownloadDeviceId();
  const authorization = await fetch(
    `${apiBaseUrl}/api/v1/media/${encodeURIComponent(track.mediaId)}/interact/download`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deviceId }),
    }
  );
  const authorizationPayload: unknown = await authorization.json().catch(() => null);
  if (!authorization.ok) {
    throw new Error(responseMessage(authorizationPayload, authorization.status, 'Download authorization failed'));
  }
  const expiresAt =
    authorizationPayload &&
    typeof authorizationPayload === 'object' &&
    'expiresAt' in authorizationPayload &&
    typeof authorizationPayload.expiresAt === 'string'
      ? authorizationPayload.expiresAt
      : null;

  let mediaUrl = track.url;
  if (track.accessType !== 'FREE') {
    const playback = await fetch(
      `${apiBaseUrl}/api/v1/media/${encodeURIComponent(track.mediaId)}/playback`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const playbackPayload: unknown = await playback.json().catch(() => null);
    if (!playback.ok) {
      throw new Error(responseMessage(playbackPayload, playback.status, 'Protected download could not be authorized'));
    }
    if (
      !playbackPayload ||
      typeof playbackPayload !== 'object' ||
      !('url' in playbackPayload) ||
      typeof playbackPayload.url !== 'string'
    ) {
      throw new Error('The download service returned an invalid media URL.');
    }
    mediaUrl = playbackPayload.url;
  }

  await ensurePrivateDirectory();
  const encrypted = track.accessType !== 'FREE';
  const savedUri = `${DOWNLOAD_DIRECTORY}${encodeURIComponent(track.id)}${encrypted ? '.fwaya' : '.audio'}`;
  if (encrypted) {
    const audioResponse = await fetch(mediaUrl);
    if (!audioResponse.ok) {
      throw new Error(`The audio file could not be downloaded (${audioResponse.status}).`);
    }
    const audioBytes = new Uint8Array(await audioResponse.arrayBuffer());
    if (audioBytes.length === 0) throw new Error('The downloaded audio file is empty.');
    const nonce = Crypto.getRandomBytes(12);
    const ciphertext = gcm(await getDeviceEncryptionKey(), nonce).encrypt(audioBytes);
    const combined = new Uint8Array(nonce.length + ciphertext.length);
    combined.set(nonce, 0);
    combined.set(ciphertext, nonce.length);
    await FileSystem.writeAsStringAsync(savedUri, fromByteArray(combined), {
      encoding: FileSystem.EncodingType.Base64,
    });
  } else {
    try {
      const result = await FileSystem.downloadAsync(mediaUrl, savedUri);
      const file = await FileSystem.getInfoAsync(result.uri);
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`The audio file could not be downloaded (${result.status}).`);
      }
      if (!file.exists || !file.size) throw new Error('The downloaded audio file is empty.');
    } catch (error) {
      await FileSystem.deleteAsync(savedUri, { idempotent: true });
      throw error;
    }
  }

  const download: PrivateMobileDownload = {
    ...track,
    id: track.id,
    url: encrypted ? '' : track.url,
    expiresAt: track.accessType === 'PREMIUM' ? expiresAt : null,
    encrypted,
    fileUri: savedUri,
    downloadedAt: new Date().toISOString(),
  };
  const storageKey = downloadsStorageKey(track.userId);
  const existingDownloads = await listPrivateDownloads(track.userId);
  await AsyncStorage.setItem(
    storageKey,
    JSON.stringify([
      ...existingDownloads.filter((item) => item.mediaId !== track.mediaId),
      download,
    ])
  );
  return download;
}

export async function listPrivateDownloads(userId: number): Promise<PrivateMobileDownload[]> {
  const stored = await AsyncStorage.getItem(downloadsStorageKey(userId));
  if (!stored) return [];
  const parsed: unknown = JSON.parse(stored);
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (entry) =>
        entry &&
        typeof entry === 'object' &&
        typeof entry.mediaId === 'string' &&
        typeof entry.fileUri === 'string'
    )
  ) {
    throw new Error('The saved download list has an invalid format.');
  }
  return parsed as PrivateMobileDownload[];
}

export async function getPlayableDownload(
  download: PrivateMobileDownload
): Promise<string> {
  if (download.accessType === 'PREMIUM' && download.expiresAt) {
    const expiry = Date.parse(download.expiresAt);
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      throw new Error('This Premium download has expired with your subscription. Connect to refresh access.');
    }
  }

  const info = await FileSystem.getInfoAsync(download.fileUri);
  if (!info.exists) throw new Error('This private download is missing from this device.');
  if (!download.encrypted) return download.fileUri;

  const encoded = await FileSystem.readAsStringAsync(download.fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const encryptedBytes = toByteArray(encoded);
  if (encryptedBytes.length <= 12) throw new Error('The protected download file is incomplete.');
  const nonce = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);
  let audioBytes: Uint8Array;
  try {
    audioBytes = gcm(await getDeviceEncryptionKey(), nonce).decrypt(ciphertext);
  } catch (error) {
    console.error('Unable to decrypt a private audio download:', error);
    throw new Error('This protected download cannot be opened on this device.');
  }

  const playableUri = `${FileSystem.cacheDirectory}fwaya-play-${encodeURIComponent(download.mediaId)}.audio`;
  await FileSystem.writeAsStringAsync(playableUri, fromByteArray(audioBytes), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return playableUri;
}

export async function removePrivateDownload(
  userId: number,
  mediaId: string
): Promise<void> {
  const downloads = await listPrivateDownloads(userId);
  const target = downloads.find((download) => download.mediaId === mediaId);
  if (target) {
    const file = await FileSystem.getInfoAsync(target.fileUri);
    if (file.exists) await FileSystem.deleteAsync(target.fileUri, { idempotent: true });
  }
  await AsyncStorage.setItem(
    downloadsStorageKey(userId),
    JSON.stringify(downloads.filter((download) => download.mediaId !== mediaId))
  );
}
