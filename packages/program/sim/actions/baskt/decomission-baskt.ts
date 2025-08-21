import { BN } from 'bn.js';
import dotenv from 'dotenv';
import { client } from '../../client';
import { PublicKey } from '@solana/web3.js';

dotenv.config();

const decomissionBaskt = async (args: string[]) => {
  try {
    if (args.length < 1) {
      throw new Error('Usage: decomission-baskt <basktId>');
    }

    const basktId = args[0];
    
    console.log('Decomissioning baskt:', basktId);

    const decommissionTx = await client.decommissionBaskt(new PublicKey(basktId));
    console.log('Baskt decommissioned with transaction:', decommissionTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

decomissionBaskt.description =
  'Decomissions a basket: decomission-baskt <basktId>';
decomissionBaskt.aliases = ['db'];

export default decomissionBaskt;
