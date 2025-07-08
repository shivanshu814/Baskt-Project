import { useTokenBalance } from './useTokenBalance';
import { USDC_MINT } from '@baskt/ui';
import { PublicKey } from '@solana/web3.js';

export function useUSDCBalance(address?: string | PublicKey) {
  console.log('useUSDCBalance', USDC_MINT.toBase58());
  return useTokenBalance(USDC_MINT, address);
}
