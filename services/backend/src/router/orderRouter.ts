/** @format */

import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { sdkClient } from '../utils';
import { PublicKey } from '@solana/web3.js';
import { OnchainOrder } from '@baskt/types';

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
