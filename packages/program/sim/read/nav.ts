import dotenv from 'dotenv';
import { client } from '../client';
import { PublicKey } from '@solana/web3.js';
import { USDC_MINT } from '@baskt/sdk';
import { getCurrentNavForBaskt } from '../utils';

dotenv.config();

const getNav = async (args: string[]) => {
  const basktId = new PublicKey(args[0]);
  const nav = await getCurrentNavForBaskt(basktId);
  console.log(nav.toNumber() / 1e6);
};

getNav.description = 'nav of current baskt';
getNav.aliases = ['nav'];

export default getNav;
