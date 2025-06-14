/** @format */

import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { sdkClient } from '../utils';
import { PublicKey } from '@solana/web3.js';
import { OnchainOrder } from '@baskt/types';
import { OrderModel } from '../utils/models';
import { BN } from 'bn.js';

const sdkClientInstance = sdkClient();

export const orderRouter = router({
  // 1. Get All orders
  getAllOrders: publicProcedure.query(async () => {
    try {
      const orders = await sdkClientInstance.getAllOrders();
      return {
        success: true,
        data: orders,
      };
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return {
        success: false,
        message: 'Failed to fetch orders',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }),

  // 2. Get orders for a baskt
  getOrdersByBaskt: publicProcedure
    .input(z.object({ basktId: z.string() }))
    .query(async ({ input }) => {
      try {
        const { basktId } = input;
        const orders = await sdkClientInstance.getAllOrders();
        const basktIdPublicKey = new PublicKey(basktId);
        const filteredOrders = orders.filter((order) => order.basktId.equals(basktIdPublicKey));

        return {
          success: true,
          data: filteredOrders.map((order) => convertOrder(order)),
        };
      } catch (error) {
        console.error('Error fetching orders by baskt:', error);
        return {
          success: false,
          message: 'Failed to fetch orders for the specified baskt',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // 3. Get All orders for a user
  getOrdersByUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const { userId } = input;
        const orders = await sdkClientInstance.getAllOrders();
        const userPublicKey = new PublicKey(userId);

        // Filter orders for the specified user
        const filteredOrders = orders.filter((order) => order.owner.equals(userPublicKey));

        return {
          success: true,
          data: filteredOrders.map((order) => convertOrder(order)),
        };
      } catch (error) {
        console.error('Error fetching orders by user:', error);
        return {
          success: false,
          message: 'Failed to fetch orders for the specified user',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  getOrdersByBasktAndUser: publicProcedure
    .input(z.object({ basktId: z.string(), userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const { basktId, userId } = input;
        const orders = await sdkClientInstance.getAllOrders();
        const basktIdPublicKey = new PublicKey(basktId);
        const userPublicKey = new PublicKey(userId);

        // Filter orders for the specified baskt and user
        const filteredOrders = orders.filter(
          (order) => order.basktId.equals(basktIdPublicKey) && order.owner.equals(userPublicKey),
        );

        return {
          success: true,
          data: filteredOrders.map((order) => convertOrder(order)),
        };
      } catch (error) {
        console.error('Error fetching orders by baskt and user:', error);
        return {
          success: false,
          message: 'Failed to fetch orders for the specified baskt and user',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  createOrder: publicProcedure
    .input(
      z.object({
        address: z.string(),
        owner: z.string(),
        orderId: z.string(),
        basktId: z.string(),
        userPublicKey: z.string(),
        size: z.string(),
        collateral: z.string(),
        isLong: z.boolean(),
        action: z.number(),
        status: z.string(),
        timestamp: z.string(),
        targetPosition: z.string().nullable(),
        bump: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const order = new OrderModel(input);
        await order.save();
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
    }),

  closeOrder: publicProcedure
    .input(
      z.object({
        orderPDA: z.string(),
        position: z.string(),
        exitPrice: z.string(),
        baskt: z.string(),
        ownerTokenAccount: z.string(),
        treasury: z.string(),
        treasuryTokenAccount: z.string(),
        orderOwner: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const tx = await sdkClientInstance.closePosition({
          orderPDA: new PublicKey(input.orderPDA),
          position: new PublicKey(input.position),
          exitPrice: new BN(input.exitPrice),
          baskt: new PublicKey(input.baskt),
          ownerTokenAccount: new PublicKey(input.ownerTokenAccount),
          treasury: new PublicKey(input.treasury),
          treasuryTokenAccount: new PublicKey(input.treasuryTokenAccount),
          orderOwner: input.orderOwner ? new PublicKey(input.orderOwner) : undefined,
        });

        return {
          success: true,
          data: tx,
        };
      } catch (error) {
        console.error('Error closing order:', error);
        return {
          success: false,
          message: 'Failed to close order',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),
});

function convertOrder(order: OnchainOrder) {
  return {
    ...order,
    orderId: order.orderId.toString(),
    size: order.size.toString(),
    collateral: order.collateral.toString(),
    timestamp: order.timestamp.toString(),
  };
}
