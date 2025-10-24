import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes with clsx for conditional classes
 * @param inputs Class values to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
export function formatDate(
  dateString: string, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Formats a timestamp to relative time (e.g. "2 hours ago")
 * @param timestamp ISO date string or Date object
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }

  return 'Just now';
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