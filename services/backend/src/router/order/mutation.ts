import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { querier } from '../../utils/querier';
import { OrderAction, OrderType } from '@baskt/types';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

// create an order
export const createOrder = publicProcedure
  .input(
    z.object({
      orderId: z.string(),
      owner: z.string(),
      createOrder: z.object({
        tx: z.string(),
        ts: z.string(),
      }),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const basktClient = querier.getBasktClient();
      const onchainOrder = await basktClient.getOrderById(
        Number(input.orderId),  
        new PublicKey(input.owner)
      );

      const order = await querier.metadata.createOrder({
        orderPDA: onchainOrder.address.toString(),
        orderId: onchainOrder.orderId.toString(),
        basktId: onchainOrder.basktId.toString(),
        createOrder: {
          tx: input.createOrder.tx,
          ts: input.createOrder.ts,
        },
        orderStatus: onchainOrder.status,
        orderAction: onchainOrder.action,
        orderType: onchainOrder.orderType,
        owner: input.owner,
        timestamp: onchainOrder.timestamp.toString(),
        
        // Action-specific parameters
        ...(onchainOrder.openParams && {
          openParams: {
            notionalValue: onchainOrder.openParams.notionalValue.toString(),
            leverageBps: onchainOrder.openParams.leverageBps.toString(),
            collateral: onchainOrder.openParams.collateral.toString(),
            isLong: onchainOrder.openParams.isLong,
          }
        }),
        ...(onchainOrder.closeParams && {
          closeParams: {
            sizeAsContracts: onchainOrder.closeParams.sizeAsContracts.toString(),
            targetPosition: onchainOrder.closeParams.targetPosition.toString(),
          }
        }),
        
        // Order type-specific parameters
        ...(onchainOrder.marketParams && {
          marketParams: onchainOrder.marketParams
        }),
        ...(onchainOrder.limitParams && {
          limitParams: {
            limitPrice: onchainOrder.limitParams.limitPrice.toString(),
            maxSlippageBps: onchainOrder.limitParams.maxSlippageBps.toString(),
          }
        }),
      });
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      console.error('Error creating order:', error);
      return {
        success: false,
        message: 'Failed to create order',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

// update an order status
export const updateOrderStatus = publicProcedure
  .input(
    z.object({
      orderPDA: z.string(),
      orderStatus: z.string(),
      orderFullFillTx: z.string().optional(),
      orderFullfillTs: z.string().optional(),
      position: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const { orderPDA, ...updateData } = input;
      const order = await querier.metadata.updateOrderByPDA(orderPDA, {
        orderStatus: updateData.orderStatus,
        fullFillOrder: {
          tx: updateData.orderFullFillTx,
          ts: updateData.orderFullfillTs,
        },
        position: updateData.position,
      });
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        message: 'Failed to update order status',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
