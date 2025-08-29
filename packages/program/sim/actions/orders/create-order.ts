import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { USDC_MINT } from '@baskt/sdk';

const createOrderOpen = async (args: string[]) => {
  const basktId = new PublicKey(args[1]);
  
  const notionalValue = new BN(parseFloat(args[2]) * 1e6);
  const isLong = args[3] === 'true';
  const orderType = args[4] || 'market'; // market or limit
  const limitPrice = args[5] ? new BN(parseFloat(args[5]) * 1e6) : new BN(0);
  const maxSlippageBps = args[6] ? new BN(parseInt(args[6])) : new BN(100); // Default 1% slippage
  const leverageBps = args[7] ? new BN(parseInt(args[7])) : new BN(10000); // Default 1x leverage

  const ownerTokenAccount = getAssociatedTokenAddressSync(
    USDC_MINT,
    client.getPublicKey(),
  );

  const orderId = client.newUID();

  // Calculate collateral based on leverage
  const collateralRequired = notionalValue.mul(new BN(10000)).div(leverageBps).muln(12).divn(10); // 120% of required

  let orderTx;
  
  if (orderType === 'limit') {
    orderTx = await client.createLimitOpenOrder({
      orderId,
      basktId,
      notionalValue,
      collateral: collateralRequired,
      isLong,
      leverageBps,
      limitPrice,
      maxSlippageBps,
      ownerTokenAccount,
    });
  } else {
    orderTx = await client.createMarketOpenOrder({
      orderId,
      basktId,
      notionalValue,
      leverageBps,
      ownerTokenAccount,
      collateral: collateralRequired,
      isLong,
    });
  }

  const orderPDA = await client.getOrderPDA(orderId, client.getPublicKey());

  console.log('Order creation completed successfully! ', orderTx);
  console.log('Order Type:', orderType);
  console.log('Notional Value:', notionalValue.toString());  
  console.log('Collateral Required:', collateralRequired.toString());
  if (orderType === 'limit') {
    console.log('Limit Price:', limitPrice.toString());
    console.log('Max Slippage BPS:', maxSlippageBps.toString());
  }
  console.log('Order ID:', orderId.toString());
  console.log('Order PDA:', orderPDA.toString());
};

const createOrderClose = async (args: string[]) => {
  const positionPDA = new PublicKey(args[1]);
  const orderType = args[2] || 'market'; // market or limit
  const limitPrice = args[3] ? new BN(parseFloat(args[3]) * 1e6) : new BN(0);
  const maxSlippageBps = args[4] ? new BN(parseInt(args[4])) : new BN(100); // Default 1% slippage
  
  // Support both absolute size and percentage-based closing
  let sizeToClose: BN | undefined;
  if (args[5]) {
    if (args[5].endsWith('%')) {
      // Percentage-based closing
      const percentage = parseFloat(args[5].slice(0, -1));
      if (percentage <= 0 || percentage > 100) {
        throw new Error('Percentage must be between 0 and 100');
      }
      // Will calculate after fetching position
      sizeToClose = undefined; // Will be calculated after fetching position
    } else {
      // Absolute size
      sizeToClose = new BN(parseFloat(args[5]) * 1e6);
    }
  }

  const positionAccount = await client.getPosition(positionPDA);
  if (!positionAccount) {
    throw new Error('Position not found');
  }

  // Calculate close size
  let closeSize: BN;
  if (args[5] && args[5].endsWith('%')) {
    const percentage = parseFloat(args[5].slice(0, -1));
    closeSize = positionAccount.size.mul(new BN(percentage * 100)).div(new BN(10000));
  } else if (sizeToClose) {
    closeSize = sizeToClose;
  } else {
    closeSize = positionAccount.size; // Default to full position
  }

  const ownerTokenAccount = getAssociatedTokenAddressSync(
    USDC_MINT,
    client.getPublicKey(),
  );

  const orderId = client.newUID();

  let orderTx;
  
  if (orderType === 'limit') {
    orderTx = await client.createLimitCloseOrder({
      orderId,
      basktId: positionAccount.basktId,
      sizeAsContracts: closeSize,
      targetPosition: positionPDA,
      limitPrice,
      maxSlippageBps,
      ownerTokenAccount,
    });
  } else {
    orderTx = await client.createMarketCloseOrder({
      orderId,
      basktId: positionAccount.basktId,
      sizeAsContracts: closeSize,
      targetPosition: positionPDA,
      ownerTokenAccount,
    });
  }

  const orderPDA = await client.getOrderPDA(orderId, client.getPublicKey());

  console.log('Close order creation completed successfully! ', orderTx);
  console.log('Order Type:', orderType);
  console.log('Position PDA:', positionPDA.toString());
  console.log('Size to Close:', closeSize.toString());
  if (orderType === 'limit') {
    console.log('Limit Price:', limitPrice.toString());
    console.log('Max Slippage (BPS):', maxSlippageBps.toString());
  }
  console.log('Order ID:', orderId.toString());
  console.log('Order PDA:', orderPDA.toString());
};

const createOrder = async (args: string[]) => {
  try {
    if (args.length < 2) {
      console.log('Usage:');
      console.log('  Open: create-order open <basktId> <notionalValue> <isLong> [orderType] [limitPrice] [maxSlippageBps] [leverageBps]');
      console.log('  Close: create-order close <positionPDA> [orderType] [limitPrice] [maxSlippageBps] [sizeToClose]');
      console.log('');
      console.log('Parameters:');
      console.log('  orderType: "market" or "limit" (default: market)');
      console.log('  limitPrice: Price in USD (e.g., 100.5)');
      console.log('  maxSlippageBps: Max slippage in basis points (default: 100 = 1%)');
      console.log('  leverageBps: Leverage in basis points (default: 10000 = 1x)');
      console.log('  sizeToClose: Amount to close - use percentage (e.g., "50%") or absolute size in USD (e.g., "1000")');
      throw new Error('Invalid arguments');
    }
    const action = args[0];
    if (action === 'open') {
      await createOrderOpen(args);
    } else if (action === 'close') {
      await createOrderClose(args);
    } else {
      throw new Error('Action must be "open" or "close"');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

createOrder.description = 'Creates orders. Open: create-order open <basktId> <notionalValue> <isLong> [orderType] [limitPrice] [maxSlippageBps] [leverageBps]. Close: create-order close <positionPDA> [orderType] [limitPrice] [maxSlippageBps] [sizeToClose]. sizeToClose supports percentage (e.g., "50%") or absolute USD amount';
createOrder.aliases = ['cro'];

export default createOrder;
