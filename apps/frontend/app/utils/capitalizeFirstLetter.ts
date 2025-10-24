// app/utils/capitalizeFirstLetter.ts

/**
 * Capitalizes the first letter of a string.
 * @param str - The string to capitalize
 * @returns The string with the first letter capitalized
 */
export function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  