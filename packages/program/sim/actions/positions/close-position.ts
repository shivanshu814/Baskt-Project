import { BN } from 'bn.js';
import { client } from '../../client';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { USDC_MINT } from '@baskt/sdk';

const closePosition = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: close-position <positionId> <exitPrice> [limitPrice] [maxSlippageBps]');
    }

    const positionId = new BN(args[0]);
    const exitPrice = new BN(args[1]);
    
    // Optional parameters with defaults
    const limitPrice = args[2] ? new BN(args[2]) : new BN(0); // Default to market order
    const maxSlippageBps = args[3] ? new BN(args[3]) : new BN(100); // Default to 1% slippage

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
    console.log('Limit Price:', limitPrice.toString());
    console.log('Max Slippage (BPS):', maxSlippageBps.toString());

    const protocolAccount = await client.getProtocolAccount();
    if (!protocolAccount) {
      throw new Error('Protocol account not found');
    }

    await client.updateOraclePrice(position.basktId, exitPrice);

    const treasuryTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      protocolAccount.treasury,
    );
    const ownerTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      position.owner,
    );

    const orderId = client.newIdForPosition();
    const orderTx = await client.createOrderTx(
      orderId,
      position.size,
      position.collateral,
      position.isLong,
      { close: {} },
      position.address,
      limitPrice,
      maxSlippageBps,
      position.basktId,
      ownerTokenAccount,
      USDC_MINT,
      new BN(10000), // leverageBps: 1x leverage
      { market: {} }, // orderType: market order
    );

    console.log('Close order created with transaction:', orderTx);

    const orderPDA = await client.getOrderPDA(orderId, position.owner);

    const closeTx = await client.closePosition({
      orderPDA,
      position: position.address,
      exitPrice,
      baskt: position.basktId,
      ownerTokenAccount,
      treasury: protocolAccount.treasury,
      treasuryTokenAccount,
    });

    console.log('Position closed successfully! Transaction:', closeTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

closePosition.description =
  'Closes a position by ID and exit price. Usage: close-position <positionId> <exitPrice> [limitPrice] [maxSlippageBps]';
closePosition.aliases = ['clp'];

export default closePosition;
