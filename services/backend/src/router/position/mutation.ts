/** @format */

import { z } from 'zod';
import { PositionStatus } from '@baskt/types';
import { publicProcedure } from '../../trpc/trpc';
import { PositionMetadataModel } from '../../utils/models';

// create a position
export const createPosition = publicProcedure
  .input(
    z.object({
      positionPDA: z.string(),
      positionId: z.string(),
      basktId: z.string(),
      openOrder: z.string(),
      openPosition: z.object({
        tx: z.string(),
        ts: z.string(),
      }),
      status: z.enum([PositionStatus.OPEN, PositionStatus.CLOSED, PositionStatus.LIQUIDATED]),
      entryPrice: z.string(),
      owner: z.string(),
      size: z.string(),
      collateral: z.string(),
      isLong: z.boolean(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const position = await PositionMetadataModel.create(input);
      return {
        success: true,
        data: position,
      };
    } catch (error) {
      console.error('Error creating position:', error);
      return {
        success: false,
        message: 'Failed to create position',
      };
    }
  });

// close a position
export const closePosition = publicProcedure
  .input(
    z.object({
      positionId: z.string(),
      exitPrice: z.string(),
      tx: z.string(),
      ts: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const { positionId, exitPrice, tx, ts } = input;
      const position = await PositionMetadataModel.findOne({ positionPDA: positionId });

      if (!position) {
        return {
          success: false,
          message: 'Position not found',
        };
      }

      position.status = PositionStatus.CLOSED;
      position.closePosition = {
        exitPrice: exitPrice,
        tx,
        ts,
      };
      await position.save();

      return {
        success: true,
        data: position,
      };
    } catch (error) {
      console.error('Error closing position:', error);
      return {
        success: false,
        message: 'Failed to close position',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
