// Print the basic BLP info 
import dotenv from 'dotenv';
import { client } from '../client';
import { PublicKey } from '@solana/web3.js';
import { USDC_MINT } from '@baskt/sdk';
import { getCurrentNavForBaskt, trpc } from '../utils';

dotenv.config();

const getNav = async (args: string[]) => {
    const liquidityPool = await trpc.pool.getLiquidityPool.query();
    const depositsData = await trpc.pool.getPoolDeposits.query();

    console.log(liquidityPool.data);
    console.log(depositsData.data);
};

getNav.description = 'blp basic info';
getNav.aliases = ['blp'];

export default getNav;
