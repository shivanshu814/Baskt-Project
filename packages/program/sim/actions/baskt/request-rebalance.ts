import { PublicKey } from "@solana/web3.js";
import { client } from "../../client";

const requestRebalance = async (args: string[]) => {
  try {
    if (args.length < 1) {
      throw new Error('Usage: request-rebalance <basktId>');
    }

    const basktId = new PublicKey(args[0]);
    const requestRebalanceTx = await client.rebalanceRequest(basktId);
    console.log('Rebalance request sent successfully! Transaction:', requestRebalanceTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

requestRebalance.description = 'Requests a rebalance for a baskt. Usage: request-rebalance <basktId>';
requestRebalance.aliases = ['brr'];

export default requestRebalance;