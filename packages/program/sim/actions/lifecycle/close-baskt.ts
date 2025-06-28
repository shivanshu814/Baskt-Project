import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';

const closeBaskt = async (args: string[]) => {
  try {
    if (args.length < 1) {
      throw new Error('Usage: close-baskt <basktId>');
    }

    const basktId = new PublicKey(args[0]);

    console.log('Closing baskt:', basktId.toString());

    const closeTx = await client.closeBaskt(basktId);
    console.log('Baskt closed with transaction:', closeTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

closeBaskt.description = 'Closes a baskt - final state when all positions are closed. Usage: close-baskt <basktId>';
closeBaskt.aliases = ['cb'];

export default closeBaskt; 