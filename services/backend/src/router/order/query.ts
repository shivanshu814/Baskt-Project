import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { sdkClient } from '../../utils';
import { OrderMetadataModel, AssetMetadataModel } from '../../utils/models';
import { OrderAction, OnchainOrder } from '@baskt/types';
import mongoose from 'mongoose';

const sdkClientInstance = sdkClient();

// get all orders
export const getOrders = publicProcedure
  .input(
    z.object({
      basktId: z.string().optional(),
      userId: z.string().optional(),
      orderStatus: z.string().optional(),
      orderAction: z.enum([OrderAction.Open, OrderAction.Close]).optional(),
      orderPDA: z.string().optional(),
      assetId: z.string().optional(),
    }),
  )
  .query(async ({ input }) => {
    try {
      const onchainOrders: OnchainOrder[] = await sdkClientInstance.getAllOrders();
      const filter: any = {};
      if (input.assetId) {
        let asset = null;
        if (mongoose.Types.ObjectId.isValid(input.assetId)) {
          asset = await AssetMetadataModel.findById(input.assetId).lean();
        }
        if (!asset) {
          asset = await AssetMetadataModel.findOne({ assetAddress: input.assetId }).lean();
        }
        if (!asset) {
          return {
            success: false,
            message: 'Asset not found',
          };
        }
        filter.basktId = { $in: asset.basktIds || [] };
      } else if (input.basktId) {
        filter.basktId = input.basktId;
      }
      if (input.userId) filter.owner = input.userId;
      if (input.orderStatus) filter.orderStatus = input.orderStatus;
      if (input.orderAction) filter.orderAction = input.orderAction;
      if (input.orderPDA) filter.orderPDA = input.orderPDA;
      const orderMetadatas = await OrderMetadataModel.find(filter);
      const combinedOrders = onchainOrders.map((onchainOrder) => {
        const meta = orderMetadatas.find(
          (m) => m.orderPDA.toLowerCase() === onchainOrder.address.toString().toLowerCase(),
        );
        return convertOrder(onchainOrder, meta);
      });
      if ((!onchainOrders || !onchainOrders.length) && orderMetadatas.length) {
        return {
          success: true,
          data: orderMetadatas,
        };
      }
      const filteredOrders = combinedOrders.filter((order) => order !== null);
      return {
        success: true,
        data: filteredOrders,
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return {
        success: false,
        message: 'Failed to fetch orders',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

function convertOrder(onchainOrder: OnchainOrder, orderMetadata: any) {
  if (!orderMetadata || !onchainOrder) return null;
  return {
    orderId: onchainOrder.orderId.toString(),
    orderPDA: onchainOrder.address.toString(),
    basktId: onchainOrder.basktId.toString(),
    owner: onchainOrder.owner.toString(),
    orderStatus: onchainOrder.status,
    orderAction: onchainOrder.action,
    size: onchainOrder.size.toString(),
    collateral: onchainOrder.collateral.toString(),
    isLong: onchainOrder.isLong,
    createOrder: orderMetadata?.createOrder,
    fullFillOrder: orderMetadata?.fullFillOrder,
    position: orderMetadata?.position,
    entryPrice: orderMetadata?.entryPrice,
    exitPrice: orderMetadata?.exitPrice,
  };
}
