import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { USDC_MINT } from '@baskt/sdk';

const cancelOrder = async (args: string[]) => {
  try {
    if (args.length < 1) {
      throw new Error('Usage: cancel-order <orderId>');
    }

    const orderId = new BN(args[0]);

    console.log('Canceling order:', orderId.toString());

    // Find the order by ID
    const orders = await client.getAllOrders();
    const order = orders.find((o) => o.orderId.eq(orderId));
    if (!order) {
      throw new Error('Order not found');
    }

    const orderPDA = order.address;
    const ownerTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      order.owner,
    );

    const cancelTx = await client.cancelOrderTx(
      orderPDA,
      orderId,
      ownerTokenAccount,
    );

    console.log('Order canceled successfully! Transaction:', cancelTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

cancelOrder.description = 'Cancels an order by ID. Usage: cancel-order <orderId>';
cancelOrder.aliases = ['co'];

export default cancelOrder; 