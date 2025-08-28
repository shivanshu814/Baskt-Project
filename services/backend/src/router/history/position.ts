import { PositionOptions } from '@baskt/querier';
import BN from 'bn.js';
import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';

export const getPositionHistory = publicProcedure
  .input(
    z.object({
      basktId: z.string().optional(),
      userId: z.string().optional(),
    }),
  )
  .query(async ({ input }) => {
    try {
      const { basktId, userId } = input;
      const filter: PositionOptions = {
        isActive: false,
      };
      if (basktId) filter.basktId = basktId;
      if (userId) filter.userId = userId;

      const positionsResult = await querier.position.getPositions(filter);
      if (!positionsResult.success) {
        return {
          success: false,
          error: positionsResult.error,
        };
      }
      const positions = positionsResult.data || [];

      return {
        success: true,
        data: positions.map((position) => {
          // Calculate average exit price from partial closes
          const totalClosedSize = position.partialCloseHistory.reduce(
            (acc, close) => acc.add(new BN(close.closeAmount)),
            new BN(0),
          );

          const weightedExitPrice = position.partialCloseHistory.reduce(
            (acc, close) => acc.add(new BN(close.closeAmount).mul(new BN(close.closePrice))),
            new BN(0),
          );

          const avgExitPrice = !totalClosedSize.isZero()
            ? weightedExitPrice.div(totalClosedSize).toString()
            : position.exitPrice?.toString() || '0';

          // Calculate total PnL and fees
          const totalPnl = position.partialCloseHistory.reduce(
            (acc, close) => acc.add(new BN(close.settlementDetails.pnl.toString())),
            new BN(0),
          );

          const totalFees = position.partialCloseHistory.reduce((acc, close) => {
            const closeFees = new BN(close.settlementDetails.feeToTreasury)
              .add(new BN(close.settlementDetails.feeToBlp))
              .add(new BN(close.settlementDetails.fundingAccumulated))
              .add(new BN(close.settlementDetails.rebalanceFee));
            return acc.add(closeFees);
          }, new BN(position.openPosition.feeToTreasury).add(new BN(position.openPosition.feeToBlp)));

          return {
            positionId: position.positionId,
            basktAddress: position.basktAddress,
            entryPrice: position.entryPrice.toString(),
            averageExitPrice: avgExitPrice,
            size: position.size.toString(),
            isLong: position.isLong,
            status: position.status,
            totalPnl: totalPnl.toString(),
            totalFees: totalFees.toString(),
            entryTime: position.openPosition.ts,
            lastExitTime:
              position.closePosition?.ts ||
              (position.partialCloseHistory.length > 0
                ? position.partialCloseHistory[position.partialCloseHistory.length - 1]
                    .closePosition.ts
                : null),
          };
        }),
      };
    } catch (error) {
      console.error('Error fetching position history:', error);
      return {
        success: false,
        error: 'Failed to fetch position history',
      };
    }
  });
