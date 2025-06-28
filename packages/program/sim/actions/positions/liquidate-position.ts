import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { USDC_MINT } from '@baskt/sdk';

const liquidatePosition = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: liquidate-position <positionId> <exitPrice>');
    }

    const positionId = new PublicKey(args[0]);
    const exitPrice = new BN(args[1]);

    console.log('Liquidating position:', positionId.toString());
    console.log('Exit price:', exitPrice.toString());

    const position = await client.getPosition(positionId);
    if (!position) {
      throw new Error('Position not found');
    }

    const protocolAccount = await client.getProtocolAccount();
    if (!protocolAccount) {
      throw new Error('Protocol account not found');
    }

    const ownerTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      position.owner,
    );
    const treasuryTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      protocolAccount.treasury,
    );

    const liquidateTx = await client.liquidatePosition({
      position: positionId,
      exitPrice,
      baskt: position.basktId,
      ownerTokenAccount,
      treasury: protocolAccount.treasury,
      treasuryTokenAccount,
    });

    console.log('Position liquidated successfully! Transaction:', liquidateTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

liquidatePosition.description = 'Liquidates a position. Usage: liquidate-position <positionId> <exitPrice>';
liquidatePosition.aliases = ['lp'];

export default liquidatePosition; 