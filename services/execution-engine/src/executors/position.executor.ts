import { OrderAccepted } from '@baskt/data-bus';
import { logger } from '@baskt/data-bus';
import BN from 'bn.js';
import { basktClient } from '../config/client';
import { OnchainOrderStatus } from '@baskt/types';

export class PositionExecutor {
  async openPosition(order: OrderAccepted): Promise<{txSignature: string, positionCreated: string}> {
    try {
      const positionId = basktClient.newUID();
      logger.info('Opening position', order);

      // Use the fill price provided by Guardian
      const price = new BN(order.executionPrice);
      logger.info('Using fill price from Guardian', { price: price.toString(), basktId: order.request.order.basktId });

      if (price.lte(new BN(0))) {
        logger.error('Invalid execution price from Guardian', { price: price.toString(), orderId: order.request.order.orderId });
        throw new Error('Invalid execution price');
      }

      // Ensure order exists and is still pending before execution
      const { orderPDA, status } = await basktClient.getOrderStatusWithRetry({
        orderId: Number(order.request.order.orderId),
        owner: order.request.order.owner,
        commitment: 'confirmed',
        retries: 3,
        delay: 1500,
      });

      logger.info('Checked order status', { orderPDA: orderPDA.toString(), status, orderId: order.request.order.orderId });

      if (status === OnchainOrderStatus.CANCELLED || status === OnchainOrderStatus.FILLED) {
        logger.info('Skipping execution - order not pending', {
          orderId: order.request.order.orderId,
          owner: order.request.order.owner,
          status,
        });
        return { txSignature: 'CANCELLED', positionCreated: '' };
      }

      if (!status) {
        logger.error('Order account not found on-chain after retries', {
          orderId: order.request.order.orderId,
          owner: order.request.order.owner,
        });
        throw new Error('Order does not exist on-chain after multiple attempts. It may not be created yet or RPC is out of sync.');
      }
      
      const tx = await basktClient.openPosition({
        order: orderPDA,
        positionId,
        entryPrice: price,
        baskt: order.request.order.basktId,
        orderOwner: order.request.order.owner,
      });

      logger.info('Position opened', { positionId: positionId.toString(), tx });


      return {txSignature: tx, positionCreated: positionId.toString()};
    } catch (error) {
      logger.error('Failed to open position', {
        orderId: order.request.order.orderId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async closePosition(order: OrderAccepted): Promise<string> {
    if (!order.request.order.closeParams!.targetPosition) {
      throw new Error('Target position required for close order');
    }

    const position = await basktClient.readWithRetry(
      () => basktClient.getPosition(order.request.order.closeParams!.targetPosition!),
      3,
      1000
    );

    // Use the fill price provided by Guardian
    const exitPrice = new BN(order.executionPrice);
    logger.info('Using fill price from Guardian for close', { price: exitPrice.toString(), orderId: order.request.order.orderId });

    // Get account details
    const protocolAccount = await basktClient.getProtocolAccount();
    const ownerTokenAccount = await basktClient.getUSDCAccount(order.request.order.owner);
    const treasuryTokenAccount = await basktClient.getUSDCAccount(protocolAccount.treasury);

    // Ensure order exists and is still pending before close
    const { orderPDA, status } = await basktClient.getOrderStatusWithRetry({
        orderId: Number(order.request.order.orderId),
        owner: order.request.order.owner,
        commitment: 'confirmed',
        retries: 3,
        delay: 1500,
      });

      if (status === OnchainOrderStatus.CANCELLED || status === OnchainOrderStatus.FILLED || !status) {
        logger.info('Skipping close execution - order not pending', {
          orderId: order.request.order.orderId,
          owner: order.request.order.owner,
          status,
        });
        return 'CANCELLED';
      }

    // Execute on-chain
    const tx = await basktClient.closePosition({
      orderPDA,
      position: position.positionPDA,
      exitPrice,
      baskt: order.request.order.basktId,
      ownerTokenAccount: ownerTokenAccount.address,
      treasury: protocolAccount.treasury,
      treasuryTokenAccount: treasuryTokenAccount.address,   
      orderOwner: order.request.order.owner,
    });

    logger.info('Position closed', { position: position.positionPDA.toString(), tx });

    return tx;
  }
}
