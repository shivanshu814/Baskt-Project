/** @format */

import { z } from 'zod';
import { PositionStatus } from '@baskt/types';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';
import BN from 'bn.js';

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
      remainingSize: z.string(),
      collateral: z.string(),
      isLong: z.boolean(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const position = await querier.metadata.createPosition(input);
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
      positionPDA: z.string(),
      exitPrice: z.string(),
      tx: z.string(),
      ts: z.string(),
      closeOrder: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const { positionPDA, exitPrice, tx, ts, closeOrder } = input;

      const position = await querier.metadata.findPositionByPDA(positionPDA);

      if (!position) {
        return {
          success: false,
          message: 'Position not found',
        };
      }

      const updateData = {
        status: PositionStatus.CLOSED,
        exitPrice,
        closePosition: {
          tx,
          ts,
        },
        ...(closeOrder && { closeOrder }),
      };

      const updatedPosition = await querier.metadata.updatePositionByPDA(positionPDA, updateData);

      return {
        success: true,
        data: updatedPosition,
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

// partially close a position
export const partialClosePosition = publicProcedure
  .input(
    z.object({
      positionPDA: z.string(),
      closeAmount: z.string(),
      closePrice: z.string(),
      pnl: z.string(),
      feeCollected: z.string(),
      tx: z.string(),
      ts: z.string(),
      closeOrder: z.string().optional(),
      sizeRemaining: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      const {
        positionPDA,
        closeAmount,
        closePrice,
        pnl,
        feeCollected,
        tx,
        ts,
        closeOrder,
        sizeRemaining,
      } = input;

      const position = await querier.metadata.findPositionByPDA(positionPDA);

      if (!position) {
        return {
          success: false,
          message: 'Position not found',
        };
      }

      const partialCloseEntry = {
        id: `${positionPDA}-${Date.now()}`,
        closeAmount,
        closePrice,
        pnl,
        feeCollected,
        closePosition: {
          tx,
          ts,
        },
      };

      let remainingSize: BN;
      let closeAmountBN: BN;
      let currentSize: BN;

      if (sizeRemaining) {
        remainingSize = new BN(sizeRemaining);
        closeAmountBN = new BN(closeAmount);
        currentSize = new BN(position.remainingSize || position.size || '0');
        // console.log('using onchain sizremaining:', remainingsize.toString());
      } else {
        currentSize = new BN(position.remainingSize || position.size || '0');
        closeAmountBN = new BN(closeAmount);

        if (closeAmountBN.gt(currentSize)) {
          return {
            success: false,
            message: `Cannot close ${closeAmountBN.toString()} when remaining size is ${currentSize.toString()}`,
          };
        }

        remainingSize = currentSize.sub(closeAmountBN);

        if (remainingSize.lt(new BN(1000))) {
          remainingSize = new BN(0);
          // console.log(
          //   'onchain  small remaining size detected:',
          //   remainingSize.toString(),
          // );
        }
      }

      const currentCollateral = new BN(position.collateral || '0');
      const closeAmountRatio = closeAmountBN.mul(new BN(1000000)).div(currentSize);
      const collateralToClose = currentCollateral.mul(closeAmountRatio).div(new BN(1000000));
      const remainingCollateral = currentCollateral.sub(collateralToClose);

      const updateData = {
        size: remainingSize.toString(),
        remainingSize: remainingSize.toString(),
        collateral: remainingCollateral.toString(),
        partialCloseHistory: [...(position.partialCloseHistory || []), partialCloseEntry],
        ...(closeOrder && { closeOrder }),
      };

      const updatedPosition = await querier.metadata.updatePositionByPDA(positionPDA, updateData);

      if (!updatedPosition) {
        return {
          success: false,
          message: 'Failed to update position',
        };
      }

      return {
        success: true,
        data: updatedPosition,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to partially close position',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
