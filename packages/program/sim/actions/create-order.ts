import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../client';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

const createOrderOpen = async (args: string[]) => {
  const basktId = new PublicKey(args[1]);
  const size = new BN(parseInt(args[2]));
  const isLong = args[3] === 'true';
  const collateral = size.muln(110).divn(100);

  const protocolAccount = await client.getProtocolAccount();

  if (!protocolAccount) {
    throw new Error('Protocol not found. Please run init:protocol first.');
  }

  const ownerTokenAccount = getAssociatedTokenAddressSync(
    protocolAccount.escrowMint,
    client.getPublicKey(),
  );

  const orderId = client.newIdForOrder();
  const action = { open: {} };
  const targetPosition = null;

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

  console.log('Order creation completed successfully! ', orderTx);
};

const createOrderClose = async (args: string[]) => {
  const positionId = new PublicKey(args[1]);
  const protocolAccount = await client.getProtocolAccount();

  if (!protocolAccount) {
    throw new Error('Protocol not found. Please run init:protocol first.');
  }

  const positionAccount = await client.getPosition(positionId);

  if (!positionAccount) {
    throw new Error('Position not found');
  }

  const ownerTokenAccount = getAssociatedTokenAddressSync(
    protocolAccount.escrowMint,
    client.getPublicKey(),
  );

  const orderId = client.newIdForOrder();
  const isLong = true;
  const action = { close: {} };

  const orderTx = await client.createOrderTx(
    orderId,
    new BN(1),
    new BN(1),
    isLong,
    action,
    positionId,
    positionAccount.basktId,
    ownerTokenAccount,
    protocolAccount.escrowMint,
  );

  console.log('Order creation completed successfully! ', orderTx);
};

const createOrder = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: create-order <open|close> <basktId|positionId> <size>');
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

createOrder.description = 'Creates a new order for a basket. Usage: create-order <basktId> <size>';
createOrder.aliases = ['co'];

export default createOrder;
