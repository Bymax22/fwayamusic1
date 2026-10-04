export interface PrivateDownload {
  id: string;
  mediaId: string;
  userId: number;
  title: string;
  artist: string;
  coverArt: string;
  duration: number;
  accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
  expiresAt: string | null;
  contentType: string;
  encrypted: boolean;
  iv: ArrayBuffer | null;
  data: Blob;
  downloadedAt: string;
}

export interface DownloadableTrack {
  id: string | number;
  title: string;
  artist: string;
  url: string;
  coverArt?: string;
  artCoverUrl?: string;
  imageUrl?: string;
  duration?: number;
  accessType?: string;
}

const DATABASE_NAME = 'fwaya-private-downloads';
const DATABASE_VERSION = 1;
const DOWNLOADS_STORE = 'downloads';
const KEYS_STORE = 'device-keys';
const DEVICE_ID_KEY = 'fwaya-private-download-device-id';
const DEVICE_KEY_ID = 'aes-gcm-v1';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(DOWNLOADS_STORE)) {
        database.createObjectStore(DOWNLOADS_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(KEYS_STORE)) {
        database.createObjectStore(KEYS_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Private downloads could not be opened.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Private download storage failed.'));
  });
}

export function getPrivateDownloadDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `web-${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

async function responseError(response: Response, fallback: string): Promise<Error> {
  const body = await response.json().catch(() => null);
  const message =
    body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
      ? body.message
      : body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `${fallback} (${response.status}).`;
  return new Error(message);
}

export async function downloadTrackToPrivateStorage(
  track: DownloadableTrack,
  userId: number,
  token: string
): Promise<PrivateDownload> {
  const mediaId = String(track.id);
  const normalizedAccess = (track.accessType || 'FREE').toUpperCase();
  if (!['FREE', 'PREMIUM', 'PAY_PER_VIEW'].includes(normalizedAccess)) {
    throw new Error('This track type is not supported for offline downloads.');
  }
  const accessType = normalizedAccess as PrivateDownload['accessType'];
  const deviceId = getPrivateDownloadDeviceId();
  const downloadResponse = await fetch(`/api/media/${encodeURIComponent(mediaId)}/interact/download`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ deviceId }),
  });
  if (!downloadResponse.ok) {
    throw await responseError(downloadResponse, 'Download authorization failed');
  }
  const downloadAuthorization: unknown = await downloadResponse.json();
  const expiresAt =
    downloadAuthorization &&
    typeof downloadAuthorization === 'object' &&
    'expiresAt' in downloadAuthorization &&
    typeof downloadAuthorization.expiresAt === 'string'
      ? downloadAuthorization.expiresAt
      : null;

  let sourceUrl = track.url;
  if (accessType !== 'FREE') {
    const playbackResponse = await fetch(`/api/media/${encodeURIComponent(mediaId)}/playback`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!playbackResponse.ok) {
      throw await responseError(playbackResponse, 'Protected download could not be authorized');
    }
    const playbackPayload: unknown = await playbackResponse.json();
    if (
      !playbackPayload ||
      typeof playbackPayload !== 'object' ||
      !('url' in playbackPayload) ||
      typeof playbackPayload.url !== 'string'
    ) {
      throw new Error('The download service returned an invalid media URL.');
    }
    sourceUrl = playbackPayload.url;
  }

  const audioResponse = await fetch(sourceUrl);
  if (!audioResponse.ok) {
    throw await responseError(audioResponse, 'The media file could not be downloaded');
  }
  const audio = await audioResponse.blob();
  return savePrivateDownload(
    {
      mediaId,
      userId,
      title: track.title,
      artist: track.artist,
      coverArt: track.coverArt || track.artCoverUrl || track.imageUrl || '/default-cover.jpg',
      duration: Math.max(0, Number(track.duration) || 0),
      accessType,
      expiresAt: accessType === 'PREMIUM' ? expiresAt : null,
      contentType: audio.type || 'audio/mpeg',
    },
    audio
  );
}

async function getDeviceKey(database: IDBDatabase): Promise<CryptoKey> {
  const readTransaction = database.transaction(KEYS_STORE, 'readonly');
  const storedKey = await requestResult(
    readTransaction.objectStore(KEYS_STORE).get(DEVICE_KEY_ID) as IDBRequest<CryptoKey | undefined>
  );
  if (storedKey) return storedKey;

  const generatedKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  const writeTransaction = database.transaction(KEYS_STORE, 'readwrite');
  writeTransaction.objectStore(KEYS_STORE).put(generatedKey, DEVICE_KEY_ID);
  await new Promise<void>((resolve, reject) => {
    writeTransaction.oncomplete = () => resolve();
    writeTransaction.onerror = () => reject(writeTransaction.error ?? new Error('Device key could not be saved.'));
    writeTransaction.onabort = () => reject(writeTransaction.error ?? new Error('Device key storage was interrupted.'));
  });
  return generatedKey;
}

export async function savePrivateDownload(
  item: Omit<PrivateDownload, 'id' | 'encrypted' | 'iv' | 'data' | 'downloadedAt'>,
  audio: Blob
): Promise<PrivateDownload> {
  const database = await openDatabase();
  try {
    const isProtected = item.accessType !== 'FREE';
    let iv: ArrayBuffer | null = null;
    let storedData: Blob | ArrayBuffer;
    if (isProtected) {
      const initializationVector = new Uint8Array(new ArrayBuffer(12));
      crypto.getRandomValues(initializationVector);
      iv = initializationVector.buffer;
      storedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: initializationVector },
        await getDeviceKey(database),
        await audio.arrayBuffer()
      );
    } else {
      storedData = audio;
    }
    const download: PrivateDownload = {
      ...item,
      id: `${item.userId}:${item.mediaId}`,
      encrypted: isProtected,
      iv,
      data: storedData instanceof Blob
        ? storedData
        : new Blob([storedData], { type: 'application/octet-stream' }),
      downloadedAt: new Date().toISOString(),
    };
    const transaction = database.transaction(DOWNLOADS_STORE, 'readwrite');
    transaction.objectStore(DOWNLOADS_STORE).put(download);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Track could not be saved.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Track could not be saved.'));
    });
    return download;
  } finally {
    database.close();
  }
}

export async function listPrivateDownloads(userId: number): Promise<PrivateDownload[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(DOWNLOADS_STORE, 'readonly');
    const records = await requestResult(
      transaction.objectStore(DOWNLOADS_STORE).getAll() as IDBRequest<PrivateDownload[]>
    );
    return records.filter((record) => record.userId === userId);
  } finally {
    database.close();
  }
}

export async function readPrivateDownload(download: PrivateDownload): Promise<Blob> {
  if (download.accessType === 'PREMIUM' && download.expiresAt) {
    const expiry = Date.parse(download.expiresAt);
    if (!Number.isFinite(expiry) || expiry <= Date.now()) {
      throw new Error('This Premium download has expired with your subscription. Connect to refresh access.');
    }
  }
  if (!download.encrypted) return download.data;
  if (!download.iv) throw new Error('The protected download is missing its device key data.');

  const database = await openDatabase();
  try {
    const key = await getDeviceKey(database);
    const iv = new Uint8Array(new ArrayBuffer(download.iv.byteLength));
    iv.set(new Uint8Array(download.iv));
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      await download.data.arrayBuffer()
    );
    return new Blob([decrypted], { type: download.contentType || 'audio/mpeg' });
  } catch (error) {
    console.error('Unable to decrypt private download:', error);
    throw new Error('This protected download cannot be opened on this browser/device.');
  } finally {
    database.close();
  }
}

export async function deletePrivateDownload(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(DOWNLOADS_STORE, 'readwrite');
    transaction.objectStore(DOWNLOADS_STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Download could not be removed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Download could not be removed.'));
    });
  } finally {
    database.close();
  }
}
