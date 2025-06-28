import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';

const decommissionBaskt = async (args: string[]) => {
  try {
    if (args.length < 1) {
      throw new Error('Usage: decommission-baskt <basktId>');
    }

    const basktId = new PublicKey(args[0]);

    console.log('Decommissioning baskt:', basktId.toString());

    const decommissionTx = await client.decommissionBaskt(basktId);
    console.log('Baskt decommissioned with transaction:', decommissionTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

decommissionBaskt.description = 'Decommissions a baskt - enters decommissioning phase. Usage: decommission-baskt <basktId>';
decommissionBaskt.aliases = ['db'];

export default decommissionBaskt; 