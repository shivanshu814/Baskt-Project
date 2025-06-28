import dotenv from 'dotenv';
import { client } from '../client';
import { PublicKey } from '@solana/web3.js';
import { USDC_MINT } from '@baskt/sdk';
import { trpc } from '../utils';

dotenv.config();

const getOrders = async (args: string[]) => {
  try {

    const user = args[0] || client.getPublicKey().toString();

    const positions = await trpc.order.getOrders.query({
    });
    // @ts-ignore
    console.log(positions.data);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

getOrders.description = 'Orders of current user';
getOrders.aliases = ['ord'];

export default getOrders;
