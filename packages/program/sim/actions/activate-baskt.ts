import { BN } from 'bn.js';
import dotenv from 'dotenv';
import { client } from '../client';
import { PublicKey } from '@solana/web3.js';

dotenv.config();

const activateBaskt = async (basktId: string, prices: number[], maxPriceAgeSec: number = 60) => {
  try {
    const pricesBN = prices.map((price) => new BN(price * 1e6));
    console.log('Activating basket...');
    const activateTx = await client.activateBaskt(new PublicKey(basktId), pricesBN, maxPriceAgeSec);
    console.log('Basket activated with transaction:', activateTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

activateBaskt.description =
  'Activates a basket by index usage, prices are multiplied by 1e6: activate-baskt <basktId> <prices> <maxPriceAgeSec>';
activateBaskt.aliases = ['ab'];

export default activateBaskt;
