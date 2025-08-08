import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { USDC_MINT } from '@baskt/sdk';
import { getCurrentNavForBaskt } from '../../utils';

const createOrderOpen = async (args: string[]) => {
  const basktId = new PublicKey(args[1]);
  
  const collateral = new BN(parseInt(args[2])).muln(1e6);
  const isLong = args[3] === 'true';
  const entryPrice = await getCurrentNavForBaskt(basktId);

  const limitPrice = args[4] ? new BN(args[4]) : entryPrice;
  const maxSlippageBps = args[5] ? new BN(args[5]) : new BN(500);


  const ownerTokenAccount = getAssociatedTokenAddressSync(
    USDC_MINT,
    client.getPublicKey(),
  );

  const orderId = client.newUID();
  const action = { open: {} };
  const targetPosition = null;

  console.log(USDC_MINT.toBase58());


  const orderTx = await client.createOrderTx({
    orderId,
    size: new BN(0),
    collateral,
    isLong,
    action,
    targetPosition,
    limitPrice,
    maxSlippageBps,
    basktId,
    ownerTokenAccount,
    collateralMint: USDC_MINT,
    leverageBps: new BN(10000),
    orderType: { market: {} },
  });

  const orderPDA = await client.getOrderPDA(orderId, client.getPublicKey());

  console.log('Order creation completed successfully! ', orderTx);
  console.log('Order ID:', orderId.toString());
  console.log('Order PDA:', orderPDA.toString());
};

const createOrderClose = async (args: string[]) => {
  const positionPDA = new PublicKey(args[1]);

  const positionAccount = await client.getPosition(positionPDA);
  if (!positionAccount) {
    throw new Error('Position not found');
  }

  const exitPrice = await getCurrentNavForBaskt(positionAccount.basktId);
  const limitPrice = args[2] ? new BN(args[2]) : exitPrice;
  const maxSlippageBps = args[3] ? new BN(args[3]) : new BN(500);
  

  const ownerTokenAccount = getAssociatedTokenAddressSync(
    USDC_MINT,
    client.getPublicKey(),
  );

  const orderId = client.newUID();
  const isLong = true;
  const action = { close: {} };

  const orderTx = await client.createOrderTx({
    orderId,
    size: new BN(1),
    collateral: new BN(1),
    isLong,
    action,
    targetPosition: positionPDA,
    limitPrice,
    maxSlippageBps,
    basktId: positionAccount.basktId,
    ownerTokenAccount,
    collateralMint: USDC_MINT,
    leverageBps: new BN(10000),
    orderType: { market: {} },
  });

  console.log('Order creation completed successfully! ', orderTx);
  console.log('Limit Price:', limitPrice.toString());
  console.log('Max Slippage (BPS):', maxSlippageBps.toString());
};

const createOrder = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: create-order <open|close> <basktId|positionId> <size> [limitPrice] [maxSlippageBps]');
    }
    const action = args[0];
    if (action === 'open') {
      await createOrderOpen(args);
    } else if (action === 'close') {
      await createOrderClose(args);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

createOrder.description = 'Creates a new order for a basket. Usage: create-order <open|close> <basktId|positionId> <size> [limitPrice] [maxSlippageBps]';
createOrder.aliases = ['cro'];

export default createOrder;
