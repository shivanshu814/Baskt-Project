import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { OrderMetadataModel } from '../../utils/models';
import { OrderAction } from '@baskt/types';

// create an order
export const createOrder = publicProcedure
  .input(
    z.object({
      orderPDA: z.string(),
      orderId: z.string(),
      basktId: z.string(),
      orderStatus: z.string(),
      orderAction: z.enum([OrderAction.Close, OrderAction.Open]),
      owner: z.string(),
      size: z.string(),
      collateral: z.string(),
      isLong: z.boolean(),
      createOrder: z.object({
        tx: z.string(),
        ts: z.string(),
      }),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const order = new OrderMetadataModel(input);
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
      const order = await OrderMetadataModel.findOneAndUpdate(
        { orderPDA },
        {
          $set: {
            orderStatus: updateData.orderStatus,
            fullFillOrder: {
              tx: updateData.orderFullFillTx,
              ts: updateData.orderFullfillTs,
            },
            position: updateData.position,
          },
        },
        { new: true },
      );
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
