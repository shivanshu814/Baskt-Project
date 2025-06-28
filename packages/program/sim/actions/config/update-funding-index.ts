import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';

const updateFundingIndex = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: update-funding-index <basktId> <newRate>');
    }

    const basktId = new PublicKey(args[0]);
    const newRate = new BN(args[1]);

    console.log('Updating funding index for baskt:', basktId.toString());
    console.log('New funding rate (BPS):', newRate.toString());

    const updateTx = await client.updateFundingIndex(basktId, newRate);
    console.log('Funding index updated successfully! Transaction:', updateTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

updateFundingIndex.description = 'Updates the funding index rate for a baskt. Usage: update-funding-index <basktId> <newRate>';
updateFundingIndex.aliases = ['ufi'];

export default updateFundingIndex; 