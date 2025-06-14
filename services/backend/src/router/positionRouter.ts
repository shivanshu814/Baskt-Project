/** @format */

import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { sdkClient } from '../utils';
import { PublicKey } from '@solana/web3.js';
import { OnchainPosition } from '@baskt/types';
import { PositionModel } from '../utils/models';
import { PositionStatus } from '@baskt/types';

const sdkClientInstance = sdkClient();

export const positionRouter = router({
  // Create a new position
  createPosition: publicProcedure
    .input(
      z.object({
        address: z.string(),
        order: z.string(),
        owner: z.string(),
        size: z.string(),
        basktId: z.string(),
        collateral: z.string(),
        isLong: z.boolean(),
        entryPrice: z.string(),
        entryPriceExponent: z.number(),
        status: z.enum(['OPEN', 'CLOSED', 'LIQUIDATED']),
        timestampOpen: z.string(),
        bump: z.number(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const position = new PositionModel(input);
        await position.save();
        return {
          success: true,
          data: position,
        };
      } catch (error) {
        console.error('Error creating position:', error);
        return {
          success: false,
          message: 'Failed to create position',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // 1. Get All positions
  getAllPositions: publicProcedure.query(async () => {
    try {
      const positions = await sdkClientInstance.getAllPositions();
      return {
        success: true,
        data: positions.map((position) => convertPosition(position)),
      };
    } catch (error) {
      console.error('Error fetching all positions:', error);
      return {
        success: false,
        message: 'Failed to fetch positions',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }),

  // 2. Get positions for a baskt
  getPositionsByBaskt: publicProcedure
    .input(z.object({ basktId: z.string() }))
    .query(async ({ input }) => {
      try {
        const { basktId } = input;
        const positions = await sdkClientInstance.getAllPositions();
        const basktIdPublicKey = new PublicKey(basktId);
        const filteredPositions = positions.filter(
          (position) => position.basktId.toString() === basktIdPublicKey.toString(),
        );

        return {
          success: true,
          data: filteredPositions.map((position) => convertPosition(position)),
        };
      } catch (error) {
        console.error('Error fetching positions by baskt:', error);
        return {
          success: false,
          message: 'Failed to fetch positions for the specified baskt',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // 3. Get All positions for a user
  getPositionsByUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const { userId } = input;
        const positionsRaw = await sdkClientInstance.getAllPositions();
        const userPublicKey = new PublicKey(userId);
        const filteredPositions = positionsRaw.filter(
          (position) => position.owner.toString() === userPublicKey.toString(),
        );
        return {
          success: true,
          data: filteredPositions.map((position) => convertPosition(position)),
        };
      } catch (error) {
        console.error('Error fetching positions by user:', error);
        return {
          success: false,
          message: 'Failed to fetch positions for the specified user',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  getPositionsByUserAndBaskt: publicProcedure
    .input(z.object({ basktId: z.string(), userId: z.string() }))
    .query(async ({ input }) => {
      try {
        const { basktId, userId } = input;
        const positions = await sdkClientInstance.getAllPositions();
        const basktIdPublicKey = new PublicKey(basktId);
        const userPublicKey = new PublicKey(userId);

        // Filter positions for the specified baskt and user
        const filteredPositions = positions.filter(
          (position) =>
            position.basktId.equals(basktIdPublicKey) && position.owner.equals(userPublicKey),
        );

        return {
          success: true,
          data: filteredPositions.map((position) => convertPosition(position)),
        };
      } catch (error) {
        console.error('Error fetching positions by baskt and user:', error);
        return {
          success: false,
          message: 'Failed to fetch positions for the specified baskt and user',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // Close a position
  closePosition: publicProcedure
    .input(
      z.object({
        positionId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { positionId } = input;
        const position = await PositionModel.findOne({ address: positionId });

        if (!position) {
          return {
            success: false,
            message: 'Position not found',
          };
        }

        position.status = PositionStatus.CLOSED;
        position.timestampClose = new Date().toISOString();
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
    }),
});

function convertPosition(position: OnchainPosition) {
  return {
    ...position,
    positionId: position.positionId.toString(),
    size: position.size.toString(),
    collateral: position.collateral.toString(),
    entryPrice: position.entryPrice?.toString(),
    timestampOpen: position.timestampOpen?.toString(),
    timestampClose: position.timestampClose?.toString(),
  };
}
