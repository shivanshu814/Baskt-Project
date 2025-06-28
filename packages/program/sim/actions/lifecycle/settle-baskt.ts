import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';

const settleBaskt = async (args: string[]) => {
  try {
    if (args.length < 1) {
      throw new Error('Usage: settle-baskt <basktId>');
    }

    const basktId = new PublicKey(args[0]);

    console.log('Settling baskt:', basktId.toString());

    const settleTx = await client.settleBaskt(basktId);
    console.log('Baskt settled with transaction:', settleTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

settleBaskt.description = 'Settles a baskt - freeze price and funding after grace period. Usage: settle-baskt <basktId>';
settleBaskt.aliases = ['sb'];

export default settleBaskt; 