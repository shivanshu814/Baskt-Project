import { BN } from 'bn.js';
import { client } from '../client';

const fillPosition = async (args: string[]) => {
  try {
    if (args.length < 1) {
      throw new Error('Usage: fill-position <orderId>');
    }

    const orderId = new BN(args[0]);
    const positionId = new BN(Date.now());

    const orders = await client.getAllOrders();
    const order = orders.find((o) => o.orderId.eq(orderId));

    if (!order) {
      throw new Error('Order not found');
    }

    console.log('Filling position for order:', orderId.toString());
    console.log('Baskt ID:', order.basktId.toString());
    console.log('Size:', order.size.toString());
    console.log('Collateral:', order.collateral.toString());

    // Generate random prices between 100 and 200
    const randomOraclePrice = Math.floor(Math.random() * 100) + 100;
    const randomEntryPrice = Math.floor(Math.random() * 100) + 100;

    const oraclePriceBN = new BN(randomOraclePrice);
    const entryPriceBN = new BN(randomEntryPrice);

    console.log('Oracle Price:', oraclePriceBN.toString());
    console.log('Entry Price:', entryPriceBN.toString());

    // Update oracle price first
    await client.updateOraclePrice(order.basktId, oraclePriceBN);

    // Open the position
    const orderPDA = await client.getOrderPDA(orderId, order.owner);
    const positionTx = await client.openPosition({
      order: orderPDA,
      positionId: positionId,
      entryPrice: entryPriceBN,
      baskt: order.basktId,
    });

    console.log('Position filled successfully! Transaction:', positionTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

fillPosition.description =
  'Fills a position for an order with random prices. Usage: fill-position <orderId>';
fillPosition.aliases = ['fp'];

export default fillPosition;
