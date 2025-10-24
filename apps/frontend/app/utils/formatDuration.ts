// app/utils/formatDuration.ts

/**
 * Format a duration from seconds to "MM:SS" format
 * @param duration - The duration in seconds
 * @returns The formatted duration (MM:SS)
 */
export function formatDuration(duration: number): string {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  }
  