import { PublicKey } from '@solana/web3.js';

export const MAX_PRICE_AGE_SEC = 60;
export const MAX_ASSET_PRICE_AGE_MS = 90 * 1000;

export const USDC_MINT = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
