import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const DEFAULT_MEDIA_COVER_URL = 'https://res.cloudinary.com/dayn5vifn/image/upload/v1777062569/fwaya-01-01_xx0lgo.jpg';
export const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/dayn5vifn/image/upload/v1777058518/ChatGPT_Image_Apr_24_2026_09_12_34_PM_ykwnqa.png';

/**
 * Merges Tailwind classes with clsx for conditional classes
 * @param inputs Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Media Type Detection Utilities - STRICT file format detection
const AUDIO_EXTENSIONS = /\.(mp3|wav|aac|flac|ogg|wma|m4a|alac)(\?.*)?$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|mkv|mov|avi|flv|m4v|mts|m2ts|3gp|3g2|mpeg|mpg|ogv)(\?.*)?$/i;

/**
 * Strictly detects if a URL points to an audio file based on file extension.
 * Only uses URL extension, ignores metadata.
 * @param url URL or filename to check
 * @returns true if it's an audio file extension
 */
export function isAudioUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return AUDIO_EXTENSIONS.test(url);
}

/**
 * Strictly detects if a URL points to a video file based on file extension.
 * Only uses URL extension, ignores metadata.
 * @param url URL or filename to check
 * @returns true if it's a video file extension
 */
export function isVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return VIDEO_EXTENSIONS.test(url);
}

/**
 * Determines if a track should be played as video based on actual file format.
 * Checks playable URL in order: videoUrl → audioUrl → url
 * Returns true ONLY if the actual file URL is a video file.
 * @param track Track object with optional videoUrl, audioUrl, url properties
 * @returns true if the track is a video file
 */
export function isVideoTrack(track?: { videoUrl?: string; audioUrl?: string; url?: string; type?: string } | null): boolean {
  if (!track) return false;

  // Check videoUrl first (if explicitly set, it should be video)
  if (track.videoUrl && isVideoUrl(track.videoUrl)) {
    return true;
  }

  // Check audioUrl (if it's actually a video extension, play as video)
  if (track.audioUrl && isVideoUrl(track.audioUrl)) {
    return true;
  }

  // Check generic url field
  if (track.url && isVideoUrl(track.url)) {
    return true;
  }

  return false;
}

/**
 * Determines if a track should be played as audio based on actual file format.
 * Checks playable URL in order: videoUrl → audioUrl → url
 * Returns true ONLY if the actual file URL is an audio file.
 * @param track Track object with optional videoUrl, audioUrl, url properties
 * @returns true if the track is an audio file
 */
export function isAudioTrack(track?: { videoUrl?: string; audioUrl?: string; url?: string; type?: string } | null): boolean {
  if (!track) return false;

  // Check videoUrl (shouldn't be audio)
  if (track.videoUrl && isAudioUrl(track.videoUrl)) {
    return true;
  }

  // Check audioUrl first (primary audio field)
  if (track.audioUrl && isAudioUrl(track.audioUrl)) {
    return true;
  }

  // Check generic url field
  if (track.url && isAudioUrl(track.url)) {
    return true;
  }

  return false;
}

// Time/Date Utilities
/**
 * Formats duration in seconds to MM:SS format
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g. "3:45")
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds)) return "0:00";
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Formats a date string to localized date format
 * @param dateString ISO date string
 * @param options Intl.DateTimeFormat options
 * @returns Formatted date string (e.g. "May 15, 2023")
 */
export function safeDate(value?: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const serializedValue = typeof value === 'object' && value !== null && '$date' in value
    ? (value as { $date?: unknown }).$date
    : value;
  const date = new Date(serializedValue as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function resolveDateValue(...values: unknown[]): Date | null {
  for (const value of values) {
    const date = safeDate(value);
    if (date) {
      return date;
    }
  }

  return null;
}

export function formatDate(
  dateString?: unknown,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string {
  const date = safeDate(dateString);
  if (!date) return 'No date';
  return date.toLocaleDateString('en-US', options);
}

/**
 * Formats a timestamp to relative time (e.g. "2 hours ago")
 * @param timestamp ISO date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: unknown): string {
  const date = safeDate(timestamp);
  if (!date) return 'No date';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs <= 0) return 'Just now';

  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 1) return 'Just now';
  if (diffSeconds < 60) return `${diffSeconds} second${diffSeconds === 1 ? '' : 's'} ago`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
}

// File/Data Utilities
/**
 * Formats file size in bytes to human readable format
 * @param bytes File size in bytes
 * @param decimals Number of decimal places
 * @returns Formatted string (e.g. "1.2 MB")
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Converts a string to URL-friendly slug
 * @param text String to convert
 * @returns URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function createMediaSlug(title: string, id: string | number) {
  const safeTitle = title ? slugify(title) : 'untitled';
  return `${safeTitle}-${id}`;
}

export function extractMediaIdFromSlug(slug?: string | string[] | null) {
  const value = Array.isArray(slug) ? slug[0] : slug;
  if (!value) return undefined;

  const matches = value.match(/-(\d+)(?:$|\/)/);
  if (matches?.[1]) {
    const parsed = Number(matches[1]);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

/**
 * Resolve a media URL to an absolute URL using a base URL.
 * Supports HTTP(S), protocol-relative URLs (//), and relative paths.
 */
export function resolveMediaUrl(url: string | undefined, baseUrl: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^\/\//.test(url)) return `https:${url}`;
  if (url.startsWith('/')) return `${baseUrl}${url}`;
  return `${baseUrl}/${url}`;
}

// Audio Utilities
/**
 * Converts BPM to human-readable tempo
 * @param bpm Beats per minute
 * @returns Tempo description (e.g. "Moderato")
 */
export function bpmToTempo(bpm: number): string {
  if (bpm < 40) return 'Grave';
  if (bpm < 60) return 'Largo';
  if (bpm < 66) return 'Larghetto';
  if (bpm < 76) return 'Adagio';
  if (bpm < 108) return 'Andante';
  if (bpm < 120) return 'Moderato';
  if (bpm < 168) return 'Allegro';
  if (bpm < 200) return 'Presto';
  return 'Prestissimo';
}

/**
 * Converts music key to emoji representation
 * @param key Music key (e.g. "C", "A#m")
 * @returns Emoji representation
 */
export function keyToEmoji(key: string): string {
  if (!key) return '🎼';
  if (key.includes('m')) return '😢'; // Minor key
  return '😊'; // Major key
}

// UI Utilities
/**
 * Generates a gradient from a string (consistent color for user/artist)
 * @param str Input string
 * @returns Tailwind gradient classes
 */
export function stringToGradient(str: string): string {
  const hash = Array.from(str).reduce((hash, char) => {
    return char.charCodeAt(0) + ((hash << 5) - hash);
  }, 0);
  
  const h = Math.abs(hash % 360);
  return `bg-gradient-to-br from-[hsl(${h},80%,40%)] to-[hsl(${h + 40},80%,60%)]`;
}

/**
 * Truncates text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Validation Utilities
/**
 * Validates if a string is a valid URL
 * @param url String to validate
 * @returns True if valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid email
 * @param email String to validate
 * @returns True if valid email
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}