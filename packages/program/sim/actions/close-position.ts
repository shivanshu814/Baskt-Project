import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { client } from '../client';

const closePosition = async (positionId: string) => {
  try {
    const selectedPosition = await client.getPosition(new PublicKey(positionId));
    const positionPDA = selectedPosition.address;
    const basktId = selectedPosition.basktId;

    const positionAccount = await client.program.account.position.fetch(positionPDA);
    console.log(`Opening Price: ${positionAccount.entryPrice.toString()} lamports`);
    console.log(`Position Size: ${positionAccount.size.toString()} units`);
    console.log(`Is Long: ${positionAccount.isLong ? 'Yes' : 'No'}`);
    console.log(`Collateral: ${positionAccount.collateral.toString()} lamports`);

    const ownerTokenAccount = (await client.getUSDCAccount(client.getPublicKey())).address;
    const protocolAccount = await client.getProtocolAccount();
    if (!protocolAccount) {
      throw new Error('Protocol account not found!');
    }

    const orderId = new anchor.BN(Date.now());
    const size = positionAccount.size;
    const collateral = positionAccount.collateral;
    const isLong = positionAccount.isLong;
    const action = { close: {} };
    const targetPosition = positionPDA;

    const orderTx = await client.createOrderTx(
      orderId,
      size,
      collateral,
      isLong,
      action,
      targetPosition,
      basktId,
      ownerTokenAccount,
      protocolAccount.escrowMint,
    );
    console.log('Close order created with transaction:', orderTx);

    const orderPDA = await client.getOrderPDA(orderId, positionAccount.owner);

    console.log('Position closed with transaction:', orderPDA);
    console.log('Position closing completed successfully!');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

closePosition.description =
  'Closes a position by index and exit price. Usage: close-position [positionIndex] [exitPrice]';
closePosition.aliases = ['clp'];

export default closePosition;
