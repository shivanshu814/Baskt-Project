import { BN } from 'bn.js';
import { client } from '../client';

const openPosition = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: open-position <orderId> <entryPrice>');
    }

    const orderId = new BN(args[0]);
    const entryPrice = new BN(args[1]);

    // Fetch the order by ID
    const orders = await client.getAllOrders();
    const order = orders.find((o) => o.orderId.eq(orderId));
    if (!order) {
      throw new Error('Order not found');
    }

    const orderPDA = order.address;
    const basktId = order.basktId;

    // Initialize funding index if it doesn't exist
    const fundingIndex = await client.getFundingIndex(basktId);
    if (!fundingIndex) {
      await client.initializeFundingIndex(basktId);
    }

    // Update oracle price
    await client.updateOraclePrice(basktId, entryPrice);

    // Generate position ID
    const positionId = new BN(Date.now());

    // Open the position
    const protocolAccount = await client.getProtocolAccount();
    if (!protocolAccount) {
      throw new Error('Protocol account not found');
    }

    // The following fields are not used in openPosition: ownerTokenAccount, treasuryTokenAccount, size, collateral, isLong, treasury
    // Only the required fields are passed as per BaseClient.openPosition
    const openTx = await client.openPosition({
      order: orderPDA,
      positionId,
      entryPrice,
      baskt: basktId,
      orderOwner: order.owner,
    });

    console.log('Position opened with transaction:', openTx);
  } catch (err) {
    console.error('Failed to open position:', err);
  }
};

openPosition.description = 'Opens a position for an order. Usage: open-position <orderId> <entryPrice> <size> <collateral> <isLong>';
openPosition.aliases = ['op'];

export default openPosition;
