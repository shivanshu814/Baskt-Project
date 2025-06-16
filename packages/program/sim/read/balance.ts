import dotenv from 'dotenv';
import { client } from '../client';
import { PublicKey } from '@solana/web3.js';
import { USDC_MINT } from '@baskt/sdk';

dotenv.config();

const getBalance = async (args: string[]) => {
  try {
    if (args.length < 1) {
      throw new Error('Usage: balance|bal <usdc|sol|blp> [user] ');
    }

    const asset = args[0];
    const user = args[1] || client.getPublicKey().toString();

    let mint = USDC_MINT;

    if (asset === 'sol') {
      const solBalance = await client.connection.getBalance(new PublicKey(user));
      console.log('Sol Balance:', solBalance.toString());
      return;
    } else if (asset === 'blp') {
      const protocolAccount = await client.getProtocolAccount();
      mint = protocolAccount.escrowMint;
    }
    const balance = await client.getUserTokenAccount(new PublicKey(user), mint);
    console.log(`${asset} Balance:`, balance.amount.toString());
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

getBalance.description = 'Balance of current user';
getBalance.aliases = ['bal'];

export default getBalance;
