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

    const orderIdNum = parseInt(args[0]);
    const orderIdBN = new BN(args[0]);

    console.log('Canceling order:', orderIdNum);

    // Find the order by ID
    const orders = await client.getAllOrders();
    // orderId is a number in OnchainOrder type
    const order = orders.find((o) => o.orderId === orderIdNum);
    if (!order) {
      throw new Error('Order not found');
    }

    const orderPDA = order.address;
    const ownerTokenAccount = getAssociatedTokenAddressSync(
      USDC_MINT,
      order.owner,
    );

    // cancelOrderTx expects a BN for orderIdNum
    const cancelTx = await client.cancelOrderTx(
      orderPDA,
      orderIdBN,
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