import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { USDC_MINT } from '@baskt/sdk';

const addCollateral = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: add-collateral <positionId> <additionalCollateral>');
    }

    const positionId = new PublicKey(args[0]);
    const additionalCollateral = new BN(parseFloat(args[1]) * 1e6);

    console.log('Adding collateral to position:', positionId.toString());
    console.log('Additional collateral amount:', additionalCollateral.toString());

    const ownerTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      client.getPublicKey(),
    );

    const addCollateralTx = await client.addCollateral({
      position: positionId,
      additionalCollateral,
      ownerTokenAccount,
    });

    console.log('Collateral added successfully! Transaction:', addCollateralTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

addCollateral.description = 'Adds collateral to a position. Usage: add-collateral <positionId> <additionalCollateral>';
addCollateral.aliases = ['ac'];

export default addCollateral; 