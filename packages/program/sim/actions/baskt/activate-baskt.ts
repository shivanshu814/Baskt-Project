import { BN } from 'bn.js';
import dotenv from 'dotenv';
import { client } from '../../client';
import { PublicKey } from '@solana/web3.js';

dotenv.config();

const activateBaskt = async (args: string[]) => {
  try {
    if (args.length < 4) {
      throw new Error('Usage: activate-baskt <basktId> <price1> <price2> <maxPriceAgeSec>');
    }

    const basktId = args[0];
    const prices = args.slice(1, args.length - 1).map((price) => new BN(price).muln(1e6));
    const maxPriceAgeSec = parseInt(args[args.length - 1]) || 60;

    console.log(
      'Activating basket with prices:',
      prices.map((p) => p.toString()),
    );
    const activateTx = await client.activateBaskt(new PublicKey(basktId), prices, maxPriceAgeSec);
    console.log('Basket activated with transaction:', activateTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

activateBaskt.description =
  'Activates a basket by index usage, prices are multiplied by 1e6: activate-baskt <basktId> <price1> <price2> [maxPriceAgeSec]';
activateBaskt.aliases = ['ab'];

export default activateBaskt;
