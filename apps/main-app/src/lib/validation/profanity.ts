import leoProfanity from 'leo-profanity';

/**
 * Checks if a string contains inappropriate language
 * @param text - The text to check for profanity
 * @returns Boolean indicating if text contains profanity
 */
export function checkProfanity(text: string): boolean {
  return leoProfanity.check(text);
}
