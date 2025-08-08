import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';
import BN from 'bn.js';

const settleBaskt = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: settle-baskt <basktId> <settlementPrice>');
    }

    const basktId = new PublicKey(args[0]);
    const settlementPrice = new BN(args[1]).mul(new BN(10 ** 6));

    console.log('Settling baskt:', basktId.toString());

    const settleTx = await client.settleBaskt(basktId, settlementPrice);
    console.log('Baskt settled with transaction:', settleTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

settleBaskt.description =
  'Settles a baskt - freeze price and funding after grace period. Usage: settle-baskt <basktId>';
settleBaskt.aliases = ['sb'];

export default settleBaskt;
