import { USDC_MINT } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';
import { useTokenBalance } from './use-token-balance';

export function useUSDCBalance(address?: string | PublicKey) {
  return useTokenBalance(USDC_MINT, address);
}
