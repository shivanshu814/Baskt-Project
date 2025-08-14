import leoProfanity from 'leo-profanity';

export function checkProfanity(text: string): boolean {
  return leoProfanity.check(text);
}
