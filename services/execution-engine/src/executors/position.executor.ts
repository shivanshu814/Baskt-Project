import { OrderAccepted } from '@baskt/data-bus';
import { logger } from '@baskt/data-bus';
import BN from 'bn.js';
import { basktClient } from '../config/client';

export class PositionExecutor {
  async openPosition(order: OrderAccepted): Promise<string> {
    try {
      const positionId = basktClient.newUID();
      logger.info('Opening position', { orderId: order.request.order.orderId, positionId: positionId.toString(), executionPrice: order.executionPrice, basktId: order.request.order.basktId });

      // Use the fill price provided by Guardian
      const price = new BN(order.executionPrice);
      logger.info('Using fill price from Guardian', { price: price.toString(), basktId: order.request.order.basktId });

      // Calculate PDA for order account
      const orderPDA = await basktClient.getOrderPDA(Number(order.request.order.orderId), order.request.order.owner);
      logger.info('Calculated order PDA', { orderPDA: orderPDA.toString(), orderId: order.request.order.orderId, owner: order.request.order.owner });

      // Fetch the order account on-chain
      let orderAccount;
      try {
        orderAccount = await basktClient.readWithRetry(
          () => basktClient.program.account.order.fetch(orderPDA, 'confirmed'),
          3,   // max attempts
          1500 // 1.5s between attempts
        );
        logger.info('Order account found on-chain', {
          orderId: orderAccount.orderId,
          status: orderAccount.status,
        });
      } catch (err) {
        logger.error('Order account not found on-chain after retries', {
          orderPDA: orderPDA.toString(),
          error: err instanceof Error ? err.message : String(err),
        });
        throw new Error(
          `Order PDA ${orderPDA.toString()} does not exist on-chain after multiple attempts. Order may not have been created yet or RPC node is out of sync.`
        );
      }
      
      const tx = await basktClient.openPosition({
        order: orderPDA,
        positionId,
        entryPrice: price,
        baskt: order.request.order.basktId,
        orderOwner: order.request.order.owner,
      });

      logger.info('Position opened', { positionId: positionId.toString(), tx });

      return tx;
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

    const orderPDA = await basktClient.getOrderPDA(Number(order.request.order.orderId), order.request.order.owner);

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
      sizeToClose: order.request.order.closeParams!.sizeAsContracts ? new BN(order.request.order.closeParams!.sizeAsContracts ) : undefined,
    });

    logger.info('Position closed', { position: position.positionPDA.toString(), tx });

    return tx;
  }
}