import { BN } from 'bn.js';
import { client } from '../client';

const closePosition = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: close-position <positionId> <exitPrice>');
    }

    const positionId = new BN(args[0]);
    const exitPrice = new BN(args[1]);

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

    const protocolAccount = await client.getProtocolAccount();
    if (!protocolAccount) {
      throw new Error('Protocol account not found');
    }

    await client.updateOraclePrice(position.basktId, exitPrice);

    const treasuryTokenAccount = (await client.getUSDCAccount(protocolAccount.treasury)).address;
    const ownerTokenAccount = (await client.getUSDCAccount(position.owner)).address;

    const orderId = new BN(Date.now());
    const orderTx = await client.createOrderTx(
      orderId,
      position.size,
      position.collateral,
      position.isLong,
      { close: {} },
      position.address,
      position.basktId,
      ownerTokenAccount,
      protocolAccount.escrowMint,
    );

    console.log('Close order created with transaction:', orderTx);

    const orderPDA = await client.getOrderPDA(orderId, position.owner);
    await client.updateOraclePrice(position.basktId, exitPrice);

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
  'Closes a position by ID and exit price. Usage: close-position <positionId> <exitPrice>';
closePosition.aliases = ['clp'];

export default closePosition;
