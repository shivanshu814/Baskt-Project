//OrderCreatedEvent

import { PublicKey } from '@solana/web3.js';
import { OnchainOrder, OrderAction } from '@baskt/types';
import { basktClient } from '../utils/config';
import { BN } from 'bn.js';
import { trpcClient } from '../utils/config';
export interface OrderCreatedEvent {
  owner: PublicKey;
  orderId: InstanceType<typeof BN>;
  basktId: PublicKey;
  size: InstanceType<typeof BN>;
  collateral: InstanceType<typeof BN>;
  isLong: boolean;
  action: OrderAction;
  targetPosition: PublicKey | null;
  timestamp: InstanceType<typeof BN>;
}

async function getCurrentNavForBaskt(basktId: PublicKey) {
  const baskt = await trpcClient.baskt.getBasktNAV.query({
    basktId: basktId.toString(),
  });

  if (!baskt.success) {
    throw new Error('Failed to fetch baskt metadata');
  }

  // @ts-expect-error data should be there when success is true
  if (!baskt.data) {
    throw new Error('Baskt metadata not found');
  }

  // @ts-expect-error data should be there when success is true
  return new BN(baskt.data.nav);
}

async function handleOpenOrder(orderCreatedData: OrderCreatedEvent, onchainOrder: OnchainOrder) {
  try {
    const positionId = basktClient.newIdForPosition();

    const price = await getCurrentNavForBaskt(onchainOrder.basktId);

    console.log(price);

    await basktClient.updateOraclePrice(onchainOrder.basktId, price);

    // open position onchain
    const tx = await basktClient.openPosition({
      order: onchainOrder.address,
      positionId,
      entryPrice: price,
      baskt: onchainOrder.basktId,
      orderOwner: onchainOrder.owner,
    });

    // open position in db
    await trpcClient.position.createPosition.mutate({
      //TOOD Shivanshu Store the positionId, orderID, tx when we opened it
      address: basktClient.getPositionPDA(onchainOrder.owner, positionId).toString(),
      order: onchainOrder.address.toString(),
      owner: onchainOrder.owner.toString(),
      size: onchainOrder.size.toString(),
      basktId: onchainOrder.basktId.toString(),
      collateral: onchainOrder.collateral.toString(),
      isLong: onchainOrder.isLong,
      entryPrice: price.toString(),
      entryPriceExponent: 6,
      status: 'OPEN',
      timestampOpen: onchainOrder.timestamp.toString(),
      bump: onchainOrder.bump,
    });

    console.log('Position opened:', tx);
    console.log('Position PDA', basktClient.getPositionPDA(onchainOrder.owner, positionId));
    console.log('Position opened:', tx);
  } catch (error) {
    console.error('Error fetching order:', error);
  }
}

async function handleCloseOrder(orderCreatedData: OrderCreatedEvent, onchainOrder: OnchainOrder) {
  try {
    const protocolAccount = await basktClient.getProtocolAccount();
    const positionAccount = await basktClient.getPosition(onchainOrder.targetPosition!);

    const exitPrice = await getCurrentNavForBaskt(onchainOrder.basktId);
    await basktClient.updateOraclePrice(onchainOrder.basktId, exitPrice);

    const ownerTokenAccount = await basktClient.getUSDCAccount(onchainOrder.owner);
    const treasuryTokenAccount = await basktClient.getUSDCAccount(protocolAccount.treasury);

    // close position onchain
    const tx = await basktClient.closePosition({
      orderPDA: onchainOrder.address,
      position: positionAccount.address,
      exitPrice: exitPrice,
      baskt: onchainOrder.basktId,
      ownerTokenAccount: ownerTokenAccount.address,
      treasury: protocolAccount.treasury,
      treasuryTokenAccount: treasuryTokenAccount.address,
      orderOwner: onchainOrder.owner,
    });

    // close position in db
    await trpcClient.position.closePosition.mutate({
      positionId: onchainOrder.targetPosition!.toString(),
    });

    console.log('Position closed:', tx);

    // close order in db
    await trpcClient.order.closeOrder.mutate({
      //TOOD Shivanshu Store the positionId, orderID, tx when we opened it
      orderPDA: onchainOrder.address.toString(),
      position: positionAccount.toString(),
      exitPrice: exitPrice.toString(),
      baskt: onchainOrder.basktId.toString(),
      ownerTokenAccount: ownerTokenAccount.address.toString(),
      treasury: protocolAccount.treasury.toString(),
      treasuryTokenAccount: treasuryTokenAccount.address.toString(),
      orderOwner: onchainOrder.owner.toString(),
    });
  } catch (error) {
    console.error('Error fetching order:', error);
  }
}

export default async function orderCreatedHandler(data: any) {
  const orderCreatedData = data as OrderCreatedEvent;

  const onchainOrder: OnchainOrder = await basktClient.readWithRetry(
    async () =>
      await basktClient.getOrderById(orderCreatedData.orderId, orderCreatedData.owner, 'confirmed'),
    2,
    100,
  );

  // create order in db
  await trpcClient.order.createOrder.mutate({
    address: onchainOrder.address.toString(),
    owner: onchainOrder.owner.toString(),
    orderId: onchainOrder.orderId.toString(),
    basktId: onchainOrder.basktId.toString(),
    userPublicKey: onchainOrder.owner.toString(),
    size: onchainOrder.size.toString(),
    collateral: onchainOrder.collateral.toString(),
    isLong: onchainOrder.isLong,
    action: onchainOrder.action,
    status: onchainOrder.status,
    timestamp: onchainOrder.timestamp.toString(),
    targetPosition: onchainOrder.targetPosition?.toString() || null,
    bump: onchainOrder.bump,
  });

  if (onchainOrder.action === OrderAction.Open) {
    handleOpenOrder(orderCreatedData, onchainOrder);
  } else {
    handleCloseOrder(orderCreatedData, onchainOrder);
  }
}
