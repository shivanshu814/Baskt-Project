/** @format */

import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { sdkClient } from '../../utils';
import { AssetMetadataModel, OrderMetadataModel, PositionMetadataModel } from '../../utils/models';
import { OrderAction, OnchainPosition, PositionStatus } from '@baskt/types';
import mongoose from 'mongoose';

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
      if (typeof input.isActive === 'boolean') {
        filter.status = input.isActive ? PositionStatus.OPEN : PositionStatus.CLOSED;
      }
      const positionMetadatas = await PositionMetadataModel.find(filter);
      const convertedPositions = await Promise.all(
        positions.map((position) => {
          const pos = positionMetadatas.find(
            (metadata) =>
              metadata.positionPDA.toLowerCase() === position.address.toString().toLowerCase(),
          );
          return convertPosition(position, pos);
        }),
      );
      return {
        success: true,
        data: convertedPositions,
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
  return {
    positionId: position.positionId.toString(),
    positionPDA: position.address.toString(),
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
  };
}

// get long open interest for an asset
export const getLongOpenInterestForAsset = publicProcedure
  .input(z.object({ assetId: z.string() }))
  .query(async ({ input }) => {
    try {
      let asset = null;
      if (mongoose.Types.ObjectId.isValid(input.assetId)) {
        asset = await AssetMetadataModel.findById(input.assetId).lean();
      }
      if (!asset) {
        asset = await AssetMetadataModel.findOne({ assetAddress: input.assetId }).lean();
      }
      if (!asset) {
        return { success: false, message: 'Asset not found' };
      }
      const basktIds = asset.basktIds || [];
      if (basktIds.length === 0) {
        return { success: true, data: { openInterest: 0, positionCount: 0, positions: [] } };
      }
      const positions = await PositionMetadataModel.find({
        basktId: { $in: basktIds },
        status: 'OPEN',
        isLong: true,
      }).lean();
      const totalSize = positions.reduce((sum, pos) => sum + Number(pos.size), 0);
      return {
        success: true,
        data: {
          openInterest: totalSize,
          positionCount: positions.length,
          positions,
        },
      };
    } catch (error) {
      console.error('Error calculating long open interest:', error);
      return {
        success: false,
        message: 'Failed to calculate long open interest',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

// get short open interest for an asset
export const getShortOpenInterestForAsset = publicProcedure
  .input(z.object({ assetId: z.string() }))
  .query(async ({ input }) => {
    try {
      let asset = null;
      if (mongoose.Types.ObjectId.isValid(input.assetId)) {
        asset = await AssetMetadataModel.findById(input.assetId).lean();
      }
      if (!asset) {
        asset = await AssetMetadataModel.findOne({ assetAddress: input.assetId }).lean();
      }
      if (!asset) {
        return { success: false, message: 'Asset not found' };
      }
      const basktIds = asset.basktIds || [];
      if (basktIds.length === 0) {
        return { success: true, data: { openInterest: 0, positionCount: 0, positions: [] } };
      }
      const positions = await PositionMetadataModel.find({
        basktId: { $in: basktIds },
        status: 'OPEN',
        isLong: false,
      }).lean();
      const totalSize = positions.reduce((sum, pos) => sum + Number(pos.size), 0);
      return {
        success: true,
        data: {
          openInterest: totalSize,
          positionCount: positions.length,
          positions,
        },
      };
    } catch (error) {
      console.error('Error calculating short open interest:', error);
      return {
        success: false,
        message: 'Failed to calculate short open interest',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

// get total open interest for an asset
export const getTotalOpenInterestForAsset = publicProcedure
  .input(z.object({ assetId: z.string() }))
  .query(async ({ input }) => {
    try {
      let asset = null;
      if (mongoose.Types.ObjectId.isValid(input.assetId)) {
        asset = await AssetMetadataModel.findById(input.assetId).lean();
      }
      if (!asset) {
        asset = await AssetMetadataModel.findOne({ assetAddress: input.assetId }).lean();
      }
      if (!asset) {
        return { success: false, message: 'Asset not found' };
      }
      const basktIds = asset.basktIds || [];
      if (basktIds.length === 0) {
        return {
          success: true,
          data: {
            totalOpenInterest: 0,
            longOpenInterest: 0,
            shortOpenInterest: 0,
            longPositionCount: 0,
            shortPositionCount: 0,
          },
        };
      }
      const openPositions = await PositionMetadataModel.find({
        basktId: { $in: basktIds },
        status: 'OPEN',
      }).lean();
      const longPositions = openPositions.filter((pos) => pos.isLong === true);
      const shortPositions = openPositions.filter((pos) => pos.isLong === false);
      const longSize = longPositions.reduce((sum, pos) => sum + Number(pos.size), 0);
      const shortSize = shortPositions.reduce((sum, pos) => sum + Number(pos.size), 0);
      return {
        success: true,
        data: {
          totalOpenInterest: longSize + shortSize,
          longOpenInterest: longSize,
          shortOpenInterest: shortSize,
          longPositionCount: longPositions.length,
          shortPositionCount: shortPositions.length,
        },
      };
    } catch (error) {
      console.error('Error calculating total open interest:', error);
      return {
        success: false,
        message: 'Failed to calculate total open interest',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

// get volume for an asset
export const getAssetVolume = publicProcedure
  .input(
    z.object({
      assetId: z.string(),
      startTime: z.number().optional(),
      endTime: z.number().optional(),
    }),
  )
  .query(async ({ input }) => {
    try {
      let asset = null;
      if (mongoose.Types.ObjectId.isValid(input.assetId)) {
        asset = await AssetMetadataModel.findById(input.assetId).lean();
      }
      if (!asset) {
        asset = await AssetMetadataModel.findOne({ assetAddress: input.assetId }).lean();
      }
      if (!asset) {
        return { success: false, message: 'Asset not found' };
      }
      const basktIds = asset.basktIds || [];
      if (basktIds.length === 0) {
        return {
          success: true,
          data: {
            totalVolume: 0,
            buyVolume: 0,
            sellVolume: 0,
            openingVolume: 0,
            closingVolume: 0,
            notionalVolume: 0,
            orderCount: 0,
            avgTradeSize: 0,
            orders: [],
          },
        };
      }
      const query: { [key: string]: any } = {
        basktId: { $in: basktIds },
        orderStatus: 'FILLED',
      };
      if (input.startTime || input.endTime) {
        query['createdAt'] = {};
        if (input.startTime) query['createdAt'].$gte = new Date(input.startTime);
        if (input.endTime) query['createdAt'].$lte = new Date(input.endTime);
      }
      const orders = await OrderMetadataModel.find(query).lean();
      const volumeMetrics = orders.reduce(
        (metrics: any, order: any) => {
          const size = Number(order.size);
          const price = Number(order.entryPrice || order.exitPrice || 0);
          metrics.totalVolume += size;
          if (order.isLong) {
            metrics.buyVolume += size;
          } else {
            metrics.sellVolume += size;
          }
          if (order.orderAction === OrderAction.Open) {
            metrics.openingVolume += size;
          } else {
            metrics.closingVolume += size;
          }
          metrics.notionalVolume += size * price;
          metrics.orderCount++;
          return metrics;
        },
        {
          totalVolume: 0,
          buyVolume: 0,
          sellVolume: 0,
          openingVolume: 0,
          closingVolume: 0,
          notionalVolume: 0,
          orderCount: 0,
        },
      );
      const avgTradeSize =
        volumeMetrics.orderCount > 0 ? volumeMetrics.totalVolume / volumeMetrics.orderCount : 0;
      return {
        success: true,
        data: {
          ...volumeMetrics,
          avgTradeSize,
          orders,
        },
      };
    } catch (error) {
      console.error('Error calculating asset volume:', error);
      return {
        success: false,
        message: 'Failed to calculate asset volume',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

// get historical open interest for an asset
export const getHistoricalOpenInterest = publicProcedure
  .input(
    z.object({
      assetId: z.string(),
      startTime: z.number().optional(),
      endTime: z.number().optional(),
      interval: z.enum(['1h', '4h', '1d', '1w']).optional().default('1d'),
    }),
  )
  .query(async ({ input }) => {
    try {
      let asset = null;
      if (mongoose.Types.ObjectId.isValid(input.assetId)) {
        asset = await AssetMetadataModel.findById(input.assetId).lean();
      }
      if (!asset) {
        asset = await AssetMetadataModel.findOne({ assetAddress: input.assetId }).lean();
      }
      if (!asset) {
        return { success: false, message: 'Asset not found' };
      }
      const basktIds = asset.basktIds || [];
      if (basktIds.length === 0) {
        return { success: true, data: [] };
      }
      const query: { [key: string]: any } = {
        basktId: { $in: basktIds },
        status: 'OPEN',
      };
      if (input.startTime || input.endTime) {
        query['createdAt'] = {};
        if (input.startTime) query['createdAt'].$gte = new Date(input.startTime);
        if (input.endTime) query['createdAt'].$lte = new Date(input.endTime);
      }
      const positions = await PositionMetadataModel.find(query).sort({ createdAt: 1 }).lean();
      const intervals: { [key: string]: any } = {};
      positions.forEach((position) => {
        const date = new Date(position.createdAt);
        let intervalKey;
        switch (input.interval) {
          case '1h':
            intervalKey = date.toISOString().slice(0, 13);
            break;
          case '4h':
            const hour = date.getHours();
            intervalKey = `${date.toISOString().slice(0, 10)}T${Math.floor(hour / 4) * 4}`;
            break;
          case '1d':
            intervalKey = date.toISOString().slice(0, 10);
            break;
          case '1w':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            intervalKey = weekStart.toISOString().slice(0, 10);
            break;
        }
        if (!intervals[intervalKey]) {
          intervals[intervalKey] = { long: 0, short: 0 };
        }
        if (position.isLong) {
          intervals[intervalKey].long += Number(position.size);
        } else {
          intervals[intervalKey].short += Number(position.size);
        }
      });
      const historicalData = Object.entries(intervals).map(([timestamp, data]: [string, any]) => ({
        timestamp,
        longOpenInterest: data.long,
        shortOpenInterest: data.short,
        totalOpenInterest: data.long + data.short,
      }));
      return {
        success: true,
        data: historicalData,
      };
    } catch (error) {
      console.error('Error calculating historical open interest:', error);
      return {
        success: false,
        message: 'Failed to calculate historical open interest',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

// get historical volume for an asset
export const getHistoricalVolume = publicProcedure
  .input(
    z.object({
      assetId: z.string(),
      startTime: z.number().optional(),
      endTime: z.number().optional(),
      interval: z.enum(['1h', '4h', '1d', '1w']).optional().default('1d'),
    }),
  )
  .query(async ({ input }) => {
    try {
      let asset = null;
      if (mongoose.Types.ObjectId.isValid(input.assetId)) {
        asset = await AssetMetadataModel.findById(input.assetId).lean();
      }
      if (!asset) {
        asset = await AssetMetadataModel.findOne({ assetAddress: input.assetId }).lean();
      }
      if (!asset) {
        return { success: false, message: 'Asset not found' };
      }
      const basktIds = asset.basktIds || [];
      if (basktIds.length === 0) {
        return { success: true, data: [] };
      }
      const query: { [key: string]: any } = {
        basktId: { $in: basktIds },
        orderStatus: 'FILLED',
      };
      if (input.startTime || input.endTime) {
        query['createdAt'] = {};
        if (input.startTime) query['createdAt'].$gte = new Date(input.startTime);
        if (input.endTime) query['createdAt'].$lte = new Date(input.endTime);
      }
      const orders = await OrderMetadataModel.find(query).sort({ createdAt: 1 }).lean();
      const intervals: { [key: string]: any } = {};
      orders.forEach((order) => {
        const date = new Date(order.createdAt);
        let intervalKey;
        switch (input.interval) {
          case '1h':
            intervalKey = date.toISOString().slice(0, 13);
            break;
          case '4h':
            const hour = date.getHours();
            intervalKey = `${date.toISOString().slice(0, 10)}T${Math.floor(hour / 4) * 4}`;
            break;
          case '1d':
            intervalKey = date.toISOString().slice(0, 10);
            break;
          case '1w':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            intervalKey = weekStart.toISOString().slice(0, 10);
            break;
        }
        if (!intervals[intervalKey]) {
          intervals[intervalKey] = {
            buy: 0,
            sell: 0,
            opening: 0,
            closing: 0,
            notional: 0,
            count: 0,
          };
        }
        const size = Number(order.size);
        const price = Number(order.entryPrice || order.exitPrice || 0);
        if (order.isLong) {
          intervals[intervalKey].buy += size;
        } else {
          intervals[intervalKey].sell += size;
        }
        if (order.orderAction === OrderAction.Open) {
          intervals[intervalKey].opening += size;
        } else {
          intervals[intervalKey].closing += size;
        }
        intervals[intervalKey].notional += size * price;
        intervals[intervalKey].count++;
      });
      const historicalData = Object.entries(intervals).map(([timestamp, data]: [string, any]) => ({
        timestamp,
        buyVolume: data.buy,
        sellVolume: data.sell,
        openingVolume: data.opening,
        closingVolume: data.closing,
        notionalVolume: data.notional,
        totalVolume: data.buy + data.sell,
        orderCount: data.count,
        avgTradeSize: data.count > 0 ? (data.buy + data.sell) / data.count : 0,
      }));
      return {
        success: true,
        data: historicalData,
      };
    } catch (error) {
      console.error('Error calculating historical volume:', error);
      return {
        success: false,
        message: 'Failed to calculate historical volume',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

// get long open interest for a baskt
export const getLongOpenInterestForBaskt = publicProcedure
  .input(z.object({ basktId: z.string() }))
  .query(async ({ input }) => {
    try {
      const positions = await PositionMetadataModel.find({
        basktId: input.basktId,
        status: 'OPEN',
        isLong: true,
      });
      const totalLongOI = positions.reduce((sum, position) => {
        return sum + Number(position.size);
      }, 0);
      return {
        success: true,
        data: {
          openInterest: totalLongOI,
          positions: positions.length,
        },
      };
    } catch (error) {
      console.error('Error fetching long open interest:', error);
      return {
        success: false,
        message: 'Failed to fetch long open interest',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

// get short open interest for a baskt
export const getShortOpenInterestForBaskt = publicProcedure
  .input(z.object({ basktId: z.string() }))
  .query(async ({ input }) => {
    try {
      const positions = await PositionMetadataModel.find({
        basktId: input.basktId,
        status: 'OPEN',
        isLong: false,
      });
      const totalShortOI = positions.reduce((sum, position) => {
        return sum + Number(position.size);
      }, 0);
      return {
        success: true,
        data: {
          openInterest: totalShortOI,
          positions: positions.length,
        },
      };
    } catch (error) {
      console.error('Error fetching short open interest:', error);
      return {
        success: false,
        message: 'Failed to fetch short open interest',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

// get total open interest for a baskt
export const getTotalOpenInterestForBaskt = publicProcedure
  .input(z.object({ basktId: z.string() }))
  .query(async ({ input }) => {
    try {
      const positions = await PositionMetadataModel.find({
        basktId: input.basktId,
        status: 'OPEN',
      });
      const totalOI = positions.reduce((sum, position) => {
        return sum + Number(position.size);
      }, 0);
      const longPositions = positions.filter((p) => p.isLong).length;
      const shortPositions = positions.filter((p) => !p.isLong).length;
      return {
        success: true,
        data: {
          totalOpenInterest: totalOI,
          longPositions,
          shortPositions,
          totalPositions: positions.length,
        },
      };
    } catch (error) {
      console.error('Error fetching total open interest:', error);
      return {
        success: false,
        message: 'Failed to fetch total open interest',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
