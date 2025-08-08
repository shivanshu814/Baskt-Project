import { BN } from 'bn.js';
import { client } from '../../client';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { USDC_MINT } from '@baskt/sdk';

const closePosition = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error(
        'Usage: close-position <positionId> <exitPrice> [sizeToClose] [limitPrice] [maxSlippageBps]',
      );
    }

    const positionId = new BN(args[0]);
    const exitPrice = new BN(args[1]);

    // Optional parameters with defaults
    const sizeToClose = args[2] ? new BN(args[2]) : undefined;
    const limitPrice = args[3] ? new BN(args[3]) : new BN(0);
    const maxSlippageBps = args[4] ? new BN(args[4]) : new BN(100);

    const positions = await client.getAllPositions();
    const position = positions.find((p) => p.positionId.eq(positionId));

    if (!position) {
      throw new Error('Position not found');
    }

    console.log('Closing position:', positionId.toString());
    console.log('Baskt ID:', position.basktId.toString());
    console.log('Size:', position.size.toString());
    console.log('Collateral:', position.collateral.toString());
    console.log('Entry Price:', position.entryPrice.toString());
    console.log('Exit Price:', exitPrice.toString());
    console.log('Size to Close:', sizeToClose ? sizeToClose.toString() : 'ENTIRE POSITION');
    console.log('Limit Price:', limitPrice.toString());
    console.log('Max Slippage (BPS):', maxSlippageBps.toString());

    const protocolAccount = await client.getProtocolAccount();
    if (!protocolAccount) {
      throw new Error('Protocol account not found');
    }


    const treasuryTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, protocolAccount.treasury);
    const ownerTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, position.owner);

    const orderId = client.newUID();
    const orderTx = await client.createOrder({
      orderId,
      size: sizeToClose || position.size,
      collateral: position.collateral,
      isLong: position.isLong,
      action: { close: {} },
      targetPosition: position.positionPDA,
      limitPrice,
      maxSlippageBps,
      basktId: position.basktId,
      ownerTokenAccount,
      collateralMint: USDC_MINT,
      leverageBps: new BN(10000), // leverageBps: 1x leverage
      orderType: { market: {} }, // orderType: market order
    });

    console.log('Close order created with transaction:', orderTx);

    const orderPDA = await client.getOrderPDA(orderId, position.owner);

    const closeTx = await client.closePosition({
      orderPDA,
      position: position.positionPDA,
      exitPrice,
      baskt: position.basktId,
      ownerTokenAccount,
      treasury: protocolAccount.treasury,
      treasuryTokenAccount,
      sizeToClose,
    });

    if (sizeToClose) {
      console.log('Position partially closed successfully! Transaction:', closeTx);
    } else {
      console.log('Position closed successfully! Transaction:', closeTx);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

closePosition.description =
  'Closes a position by ID and exit price. Usage: close-position <positionId> <exitPrice> [sizeToClose] [limitPrice] [maxSlippageBps]';
closePosition.aliases = ['clp'];

export default closePosition;
