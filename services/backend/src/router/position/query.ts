/** @format */

import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { sdkClient } from '../../utils';
import { AssetMetadataModel, OrderMetadataModel, PositionMetadataModel } from '../../utils/models';
import { OrderAction, OnchainPosition, PositionStatus } from '@baskt/types';
import mongoose from 'mongoose';
import { BN } from 'bn.js';
import { calculateUsdcSize } from '@baskt/sdk';
import { getAllAssetsInternal } from '../asset/query';

const sdkClientInstance = sdkClient();

// get all positions
export const getPositions = publicProcedure
  .input(
    z.object({
      basktId: z.string().optional(),
      assetId: z.string().optional(),
      userId: z.string().optional(),
      isActive: z.boolean().optional(),
    }),
  )
  .query(async ({ input }) => {
    try {
      const positions = await sdkClientInstance.getAllPositions();
      const filter: any = {};
      
      // Batch asset lookup optimization
      if (input.assetId) {
        // Get all assets and create lookup map
        const allAssetsResult = await getAllAssetsInternal(false, false);
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
      if (typeof input.isActive === 'boolean') {
        filter.status = input.isActive ? PositionStatus.OPEN : PositionStatus.CLOSED;
      }
      const positionMetadatas = await PositionMetadataModel.find(filter);
      const convertedPositions = await Promise.all(
        positions
          .map((position) => {
            const pos = positionMetadatas.find(
              (metadata) =>
                metadata.positionPDA.toLowerCase() ===
                position.positionPDA.toString().toLowerCase(),
            );
            return convertPosition(position, pos);
          })
          .filter((pos) => pos !== null),
      );
      const filteredPositions = convertedPositions.filter((pos) => pos !== null);
      return {
        success: true,
        data: filteredPositions,
      };
    } catch (error) {
      console.error('Error fetching positions:', error);
      return {
        success: false,
        message: 'Failed to fetch positions',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

async function convertPosition(position: OnchainPosition, positionMetadata: any) {
  if (!positionMetadata || !positionMetadata) {
    return null;
  }
  //TODO: Shivanshu Need to be able to return the position Metadata if the position account is closed
  return {
    positionId: position.positionId.toString(),
    positionPDA: position.positionPDA.toString(),
    basktId: position.basktId,
    openOrder: positionMetadata?.openOrder,
    closeOrder: positionMetadata?.closeOrder,
    openPosition: positionMetadata?.openPosition,
    closePosition: positionMetadata?.closePosition,
    positionStatus: position.status,
    entryPrice: position.entryPrice?.toString() || '',
    exitPrice: position.exitPrice?.toString() || '',
    owner: position.owner.toString(),
    status: position.status,
    size: position.size.toString(),
    collateral: position.collateral.toString(),
    isLong: position.isLong,
    usdcSize: calculateUsdcSize(new BN(position.size), position.entryPrice.toNumber()).toString(),
  };
}

// // get historical open interest for an asset
// export const getHistoricalOpenInterest = publicProcedure
//   .input(
//     z.object({
//       assetId: z.string(),
//       startTime: z.number().optional(),
//       endTime: z.number().optional(),
//       interval: z.enum(['1h', '4h', '1d', '1w']).optional().default('1d'),
//     }),
//   )
//   .query(async ({ input }) => {
//     try {
//       let asset = null;
//       if (mongoose.Types.ObjectId.isValid(input.assetId)) {
//         asset = await AssetMetadataModel.findById(input.assetId).lean();
//       }
//       if (!asset) {
//         asset = await AssetMetadataModel.findOne({ assetAddress: input.assetId }).lean();
//       }
//       if (!asset) {
//         return { success: false, message: 'Asset not found' };
//       }
//       const basktIds = asset.basktIds || [];
//       if (basktIds.length === 0) {
//         return { success: true, data: [] };
//       }
//       const query: { [key: string]: any } = {
//         basktId: { $in: basktIds },
//         status: 'OPEN',
//       };
//       if (input.startTime || input.endTime) {
//         query['createdAt'] = {};
//         if (input.startTime) query['createdAt'].$gte = new Date(input.startTime);
//         if (input.endTime) query['createdAt'].$lte = new Date(input.endTime);
//       }
//       const positions = await PositionMetadataModel.find(query).sort({ createdAt: 1 }).lean();
//       const intervals: { [key: string]: any } = {};
//       positions.forEach((position) => {
//         const date = new Date(position.createdAt);
//         let intervalKey;
//         switch (input.interval) {
//           case '1h':
//             intervalKey = date.toISOString().slice(0, 13);
//             break;
//           case '4h':
//             const hour = date.getHours();
//             intervalKey = `${date.toISOString().slice(0, 10)}T${Math.floor(hour / 4) * 4}`;
//             break;
//           case '1d':
//             intervalKey = date.toISOString().slice(0, 10);
//             break;
//           case '1w':
//             const weekStart = new Date(date);
//             weekStart.setDate(date.getDate() - date.getDay());
//             intervalKey = weekStart.toISOString().slice(0, 10);
//             break;
//         }
//         if (!intervals[intervalKey]) {
//           intervals[intervalKey] = { long: 0, short: 0 };
//         }
//         if (position.isLong) {
//           intervals[intervalKey].long += Number(position.size);
//         } else {
//           intervals[intervalKey].short += Number(position.size);
//         }
//       });
//       const historicalData = Object.entries(intervals).map(([timestamp, data]: [string, any]) => ({
//         timestamp,
//         longOpenInterest: data.long,
//         shortOpenInterest: data.short,
//         totalOpenInterest: data.long + data.short,
//       }));
//       return {
//         success: true,
//         data: historicalData,
//       };
//     } catch (error) {
//       console.error('Error calculating historical open interest:', error);
//       return {
//         success: false,
//         message: 'Failed to calculate historical open interest',
//         error: error instanceof Error ? error.message : 'Unknown error',
//       };
//     }
//   });

// // get historical volume for an asset
// export const getHistoricalVolume = publicProcedure
//   .input(
//     z.object({
//       assetId: z.string(),
//       startTime: z.number().optional(),
//       endTime: z.number().optional(),
//       interval: z.enum(['1h', '4h', '1d', '1w']).optional().default('1d'),
//     }),
//   )
//   .query(async ({ input }) => {
//     try {
//       let asset = null;
//       if (mongoose.Types.ObjectId.isValid(input.assetId)) {
//         asset = await AssetMetadataModel.findById(input.assetId).lean();
//       }
//       if (!asset) {
//         asset = await AssetMetadataModel.findOne({ assetAddress: input.assetId }).lean();
//       }
//       if (!asset) {
//         return { success: false, message: 'Asset not found' };
//       }
//       const basktIds = asset.basktIds || [];
//       if (basktIds.length === 0) {
//         return { success: true, data: [] };
//       }
//       const query: { [key: string]: any } = {
//         basktId: { $in: basktIds },
//         orderStatus: 'FILLED',
//       };
//       if (input.startTime || input.endTime) {
//         query['createdAt'] = {};
//         if (input.startTime) query['createdAt'].$gte = new Date(input.startTime);
//         if (input.endTime) query['createdAt'].$lte = new Date(input.endTime);
//       }
//       const orders = await OrderMetadataModel.find(query).sort({ createdAt: 1 }).lean();
//       const intervals: { [key: string]: any } = {};
//       orders.forEach((order) => {
//         const date = new Date(order.createdAt);
//         let intervalKey;
//         switch (input.interval) {
//           case '1h':
//             intervalKey = date.toISOString().slice(0, 13);
//             break;
//           case '4h':
//             const hour = date.getHours();
//             intervalKey = `${date.toISOString().slice(0, 10)}T${Math.floor(hour / 4) * 4}`;
//             break;
//           case '1d':
//             intervalKey = date.toISOString().slice(0, 10);
//             break;
//           case '1w':
//             const weekStart = new Date(date);
//             weekStart.setDate(date.getDate() - date.getDay());
//             intervalKey = weekStart.toISOString().slice(0, 10);
//             break;
//         }
//         if (!intervals[intervalKey]) {
//           intervals[intervalKey] = {
//             buy: 0,
//             sell: 0,
//             opening: 0,
//             closing: 0,
//             notional: 0,
//             count: 0,
//           };
//         }
//         const size = Number(order.size);
//         const price = Number(order.entryPrice || order.exitPrice || 0);
//         if (order.isLong) {
//           intervals[intervalKey].buy += size;
//         } else {
//           intervals[intervalKey].sell += size;
//         }
//         if (order.orderAction === OrderAction.Open) {
//           intervals[intervalKey].opening += size;
//         } else {
//           intervals[intervalKey].closing += size;
//         }
//         intervals[intervalKey].notional += size * price;
//         intervals[intervalKey].count++;
//       });
//       const historicalData = Object.entries(intervals).map(([timestamp, data]: [string, any]) => ({
//         timestamp,
//         buyVolume: data.buy,
//         sellVolume: data.sell,
//         openingVolume: data.opening,
//         closingVolume: data.closing,
//         notionalVolume: data.notional,
//         totalVolume: data.buy + data.sell,
//         orderCount: data.count,
//         avgTradeSize: data.count > 0 ? (data.buy + data.sell) / data.count : 0,
//       }));
//       return {
//         success: true,
//         data: historicalData,
//       };
//     } catch (error) {
//       console.error('Error calculating historical volume:', error);
//       return {
//         success: false,
//         message: 'Failed to calculate historical volume',
//         error: error instanceof Error ? error.message : 'Unknown error',
//       };
//     }
//   });
