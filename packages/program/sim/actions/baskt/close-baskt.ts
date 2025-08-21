import { BN } from 'bn.js';
import dotenv from 'dotenv';
import { client } from '../../client';
import { PublicKey } from '@solana/web3.js';

dotenv.config();

const closeBaskt = async (args: string[]) => {
  try {
    if (args.length < 1) {
      throw new Error('Usage: close-baskt <basktId>');
    }

    const basktId = args[0];
    console.log('Closing baskt:', basktId);
    const closeTx = await client.closeBaskt(new PublicKey(basktId));
    console.log('Baskt closed with transaction:', closeTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

closeBaskt.description =
  'Closes a basket: close-baskt <basktId>';
closeBaskt.aliases = ['cb'];

export default closeBaskt;
