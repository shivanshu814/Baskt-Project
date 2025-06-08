import { useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useBasktClient, USDC_MINT } from '@baskt/ui';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { Transaction } from '@solana/web3.js';
import { AccessControlRole } from '@baskt/types';
import { useToast } from '../common/use-toast';

export const useTreasuryAccount = () => {
  const { client, wallet } = useBasktClient();
  const { toast } = useToast();

  const setupTreasuryAccount = useCallback(async () => {
    if (!client || !wallet?.address) return null;

    try {
      const poolAuthority = await client.findPoolAuthorityPDA();
      const treasuryTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, poolAuthority, true);

      const hasTreasuryRole = await client.hasRole(poolAuthority, AccessControlRole.Treasury);

      if (!hasTreasuryRole) {
        await client.addRole(poolAuthority, AccessControlRole.Treasury);
      }

      const treasuryTokenAccountInfo = await client.connection.getAccountInfo(treasuryTokenAccount);
      if (!treasuryTokenAccountInfo) {
        const createTreasuryAtaIx = createAssociatedTokenAccountInstruction(
          new PublicKey(wallet.address),
          treasuryTokenAccount,
          poolAuthority,
          USDC_MINT,
        );
        const tx = new Transaction().add(createTreasuryAtaIx);
        await client.provider.sendAndConfirmLegacy(tx);
      }

      return { poolAuthority, treasuryTokenAccount };
    } catch (error) {
      toast({
        title: 'Failed to verify treasury accounts. Please contact support.',
        variant: 'destructive',
      });
      return null;
    }
  }, [client, wallet, toast]);

  return {
    setupTreasuryAccount,
  };
};
