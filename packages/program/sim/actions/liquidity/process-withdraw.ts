import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';
import { TestClient } from '../../../tests/utils/test-client';
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { USDC_MINT } from '@baskt/sdk';

const processWithdraw = async (args: string[]) => {
  try {

    const liquidityPool = await client.getLiquidityPool();
    if (!liquidityPool) {
      throw new Error('Liquidity pool not found');
    }

    const withdrawRequest = await client.getWithdrawalRequest(liquidityPool.withdrawQueueTail.add(new BN(1)));
    if (!withdrawRequest) {
      throw new Error('Withdraw request not found');
    }

    await client.processWithdrawQueue(
        withdrawRequest.provider,
        withdrawRequest.key,
        withdrawRequest.providerUsdcAccount,
    );

    console.log('Withdrawal request processed', liquidityPool.withdrawQueueTail.add(new BN(1)).toNumber());
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

processWithdraw.description = 'Processes a withdrawal request. Usage: process-withdraw <request-id>';
processWithdraw.aliases = ['pw'];

export default processWithdraw;
