import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { sdkClient } from '../../utils';
import { OrderMetadataModel, AssetMetadataModel } from '../../utils/models';
import { OrderAction, OnchainOrder } from '@baskt/types';
import mongoose from 'mongoose';
import { calculateUsdcSize } from '@baskt/sdk';
import { BN } from 'bn.js';
import { getAllAssetsInternal } from '../asset/query';

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
      
      // Batch asset lookup optimization
      if (input.assetId) {
        // Fetch all assets once and create lookup map
        const allAssetsResult = await getAllAssetsInternal(false);
        const assetLookup = new Map<string, any>();
        
        if (allAssetsResult.success && allAssetsResult.data) {
          allAssetsResult.data.forEach((asset: any) => {
            if (asset && asset.assetAddress) {
              assetLookup.set(asset.assetAddress, asset);
            }
            if (asset && asset._id) {
              assetLookup.set(asset._id.toString(), asset);
            }
          });
        }
        
        // Try to find asset by ID or address
        let asset = null;
        if (mongoose.Types.ObjectId.isValid(input.assetId)) {
          asset = assetLookup.get(input.assetId);
        }
        if (!asset) {
          asset = assetLookup.get(input.assetId);
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
      
      if (input.userId) filter.owner = { $regex: input.userId, $options: 'i' };
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

      // Also include order metadata that don't have corresponding on-chain orders (like FILLED orders)
      const onchainOrderPDAs = onchainOrders.map((order) => order.address.toString().toLowerCase());
      const metadataOnlyOrders = orderMetadatas
        .filter((meta) => !onchainOrderPDAs.includes(meta.orderPDA.toLowerCase()))
        .map((meta) => convertOrder(null, meta))
        .filter((order) => order !== null);

      if ((!onchainOrders || !onchainOrders.length) && orderMetadatas.length) {
        return {
          success: true,
          data: orderMetadatas,
        };
      }
      const filteredOrders = combinedOrders.filter((order) => order !== null);
      const allOrders = [...filteredOrders, ...metadataOnlyOrders];
      return {
        success: true,
        data: allOrders,
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

function convertOrder(onchainOrder: OnchainOrder | null, orderMetadata: any) {
  if (!orderMetadata) return null;

  // If no onchain order, create order from metadata only
  if (!onchainOrder) {
    return {
      orderId: orderMetadata.orderId,
      orderPDA: orderMetadata.orderPDA,
      basktId: orderMetadata.basktId,
      owner: orderMetadata.owner,
      status: orderMetadata.orderStatus,
      action: orderMetadata.orderAction,
      size: orderMetadata.size || '0',
      collateral: orderMetadata.collateral || '0',
      isLong: orderMetadata.isLong,
      createOrder: orderMetadata.createOrder,
      fullFillOrder: orderMetadata.fullFillOrder,
      position: orderMetadata.position,
      usdcSize: orderMetadata.usdcSize || '0',
      orderType: orderMetadata.orderType,
      limitPrice: orderMetadata.limitPrice || '0',
      maxSlippage: orderMetadata.maxSlippage || '0',
    };
  }

  const price = orderMetadata?.entryPrice ?? onchainOrder.limitPrice;
  //TODO: Shivanshu Need to be able to return the order Metadata even if the order account is closed

  return {
    orderId: onchainOrder.orderId.toString(),
    orderPDA: onchainOrder.address.toString(),
    basktId: onchainOrder.basktId.toString(),
    owner: onchainOrder.owner.toString(),
    status: onchainOrder.status,
    action: onchainOrder.action,
    size: onchainOrder.size.toString(),
    collateral: onchainOrder.collateral.toString(),
    isLong: onchainOrder.isLong,
    createOrder: orderMetadata?.createOrder,
    fullFillOrder: orderMetadata?.fullFillOrder,
    position: orderMetadata?.position,
    usdcSize: calculateUsdcSize(new BN(onchainOrder.size), price).toString(),
    orderType: onchainOrder.orderType,
    limitPrice: onchainOrder.limitPrice.toString(),
    maxSlippage: onchainOrder.maxSlippage.toString(),
  };
}
