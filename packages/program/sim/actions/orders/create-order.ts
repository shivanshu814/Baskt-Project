import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { USDC_MINT } from '@baskt/sdk';

const createOrderOpen = async (args: string[]) => {
  const basktId = new PublicKey(args[1]);
  
  const collateral = new BN(parseInt(args[2])).muln(1e6);
  const isLong = args[3] === 'true';

  const ownerTokenAccount = getAssociatedTokenAddressSync(
    USDC_MINT,
    client.getPublicKey(),
  );

  const orderId = client.newUID();

  const collateralRequired = collateral.muln(12).divn(10);

  const orderTx = await client.createMarketOpenOrder({
    orderId,
    basktId,
    notionalValue: collateral,
    leverageBps: new BN(10000),
    ownerTokenAccount,
    collateral: collateralRequired,
    isLong,
  });

  const orderPDA = await client.getOrderPDA(orderId, client.getPublicKey());

  console.log('Order creation completed successfully! ', orderTx);
  console.log('Notional Value:', collateral.toString());  
  console.log('Collateral Required:', collateralRequired.toString());
  console.log('Order ID:', orderId.toString());
  console.log('Order PDA:', orderPDA.toString());
};

const createOrderClose = async (args: string[]) => {
  const positionPDA = new PublicKey(args[1]);

  const positionAccount = await client.getPosition(positionPDA);
  if (!positionAccount) {
    throw new Error('Position not found');
  }

  

  const ownerTokenAccount = getAssociatedTokenAddressSync(
    USDC_MINT,
    client.getPublicKey(),
  );

  const orderId = client.newUID();

  const orderTx = await client.createMarketCloseOrder({
    orderId,
    basktId: positionAccount.basktId,
    sizeAsContracts: positionAccount.size,
    targetPosition: positionPDA,
    ownerTokenAccount,
  });

  console.log('Order creation completed successfully! ', orderTx);
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
