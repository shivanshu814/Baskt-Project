import { publicProcedure } from '../../trpc/trpc';
import { z } from 'zod';
import { OrderMetadataModel, PositionMetadataModel, BasktMetadataModel } from '../../utils/models';
import { HistoryItem, OrderAction, PositionStatus } from '@baskt/types';

export const getHistory = publicProcedure
  .input(
    z.object({
      basktId: z.string().optional(),
      userId: z.string().optional(),
      status: z.string().optional(),
      action: z.enum([OrderAction.Open, OrderAction.Close]).optional(),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }),
  )
  .query(async ({ input }) => {
    try {
      const { basktId, userId, status, action, limit, offset } = input;

      const orderFilter: Record<string, any> = {};
      const positionFilter: Record<string, any> = {};

      if (basktId) {
        orderFilter.basktId = basktId;
        positionFilter.basktId = basktId;
      }

      if (userId) {
        orderFilter.owner = userId;
        positionFilter.owner = userId;
      }

      if (status) {
        orderFilter.orderStatus = status;
        positionFilter.status = status;
      }

      if (action) {
        orderFilter.orderAction = action;
        if (action === OrderAction.Open) {
          positionFilter.isLong = true;
        } else if (action === OrderAction.Close) {
          positionFilter.isLong = false;
        }
      }

      // Fetch orders and positions with proper error handling
      const [orders, positions] = await Promise.all([
        OrderMetadataModel.find(orderFilter)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset)
          .lean()
          .exec(),
        PositionMetadataModel.find(positionFilter)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset)
          .lean()
          .exec(),
      ]);

      // Get unique baskt IDs and fetch baskt names
      const allBasktIds = [
        ...orders.map((o) => o.basktId).filter(Boolean),
        ...positions.map((p) => p.basktId).filter(Boolean),
      ];
      const basktIds = Array.from(new Set(allBasktIds));

      let basktNameMap = new Map<string, string>();
      if (basktIds.length > 0) {
        const basktNames = await BasktMetadataModel.find({
          basktId: { $in: basktIds },
        })
          .lean()
          .exec();
        basktNameMap = new Map(basktNames.map((b) => [b.basktId, b.name]));
      }

      const orderHistoryItems: HistoryItem[] = orders.map((order) => {
        let pnl: string | undefined;
        let pnlPercentage: string | undefined;

        if (
          order.orderStatus === 'FILLED' &&
          order.orderAction === OrderAction.Close &&
          order.limitPrice
        ) {
          try {
            const correspondingPosition = positions.find(
              (pos) =>
                pos.positionId === order.position ||
                (pos.owner === order.owner &&
                  pos.basktId === order.basktId &&
                  pos.status === PositionStatus.CLOSED),
            );

            if (correspondingPosition && correspondingPosition.entryPrice) {
              const entryPrice = parseFloat(correspondingPosition.entryPrice || '0');
              const exitPrice = parseFloat(order.limitPrice || '0');
              const size = parseFloat(order.size || '0');

              if (!isNaN(entryPrice) && !isNaN(exitPrice) && !isNaN(size)) {
                if (correspondingPosition.isLong) {
                  pnl = ((exitPrice - entryPrice) * size).toString();
                } else {
                  pnl = ((entryPrice - exitPrice) * size).toString();
                }

                const pnlValue = parseFloat(pnl);
                const collateral = parseFloat(correspondingPosition.collateral || '0');

                if (!isNaN(pnlValue) && !isNaN(collateral) && collateral > 0) {
                  pnlPercentage = ((pnlValue / collateral) * 100).toFixed(2);
                }
              }
            }
          } catch (calcError) {
            console.warn('Error calculating PnL for order:', order.orderId, calcError);
          }
        }

        return {
          id: order.orderPDA || '',
          type: 'order',
          orderId: order.orderId || '',
          basktId: order.basktId || '',
          basktName: basktNameMap.get(order.basktId) || '',
          owner: order.owner || '',
          action: order.orderAction || OrderAction.Open,
          status: order.orderStatus || '',
          size: order.size || '0',
          collateral: order.size || '0',
          isLong: order.isLong || false,
          entryPrice: order.limitPrice || undefined,
          exitPrice: order.limitPrice || undefined,
          pnl,
          pnlPercentage,
          timestamp:
            order.createOrder?.ts || order.createdAt?.toString() || new Date().toISOString(),
          createTx: order.createOrder?.tx || undefined,
          fillTx: order.fullFillOrder?.tx || undefined,
        };
      });

      const positionHistoryItems: HistoryItem[] = positions
        .map((position) => {
          let pnl: string | undefined;
          let pnlPercentage: string | undefined;

          if (position.status === PositionStatus.CLOSED && position?.exitPrice) {
            try {
              const entryPrice = parseFloat(position.entryPrice || '0');
              const exitPrice = parseFloat(position.exitPrice || '0');
              const size = parseFloat(position.size || '0');

              if (!isNaN(entryPrice) && !isNaN(exitPrice) && !isNaN(size) && entryPrice > 0) {
                const priceDiff = Math.abs(exitPrice - entryPrice);
                const pnlValue = (priceDiff * size) / entryPrice;
                const finalPnl = position.isLong
                  ? exitPrice > entryPrice
                    ? pnlValue
                    : -pnlValue
                  : entryPrice > exitPrice
                  ? pnlValue
                  : -pnlValue;

                pnl = finalPnl.toString();

                const collateral = parseFloat(position.collateral || '0');
                if (!isNaN(finalPnl) && !isNaN(collateral) && collateral > 0) {
                  pnlPercentage = ((finalPnl / collateral) * 100).toFixed(2);
                }
              }
            } catch (calcError) {
              console.warn('Error calculating PnL for position:', position.positionId, calcError);
            }
          }

          return {
            id: position.positionPDA || '',
            type: 'position',
            positionId: position.positionId || '',
            basktId: position.basktId || '',
            basktName: basktNameMap.get(position.basktId) || '',
            owner: position.owner || '',
            action: position.isLong ? OrderAction.Open : OrderAction.Close,
            status: position.status || '',
            size: position.size || '0',
            collateral: position.collateral || '0',
            isLong: position.isLong || false,
            entryPrice: position.entryPrice || undefined,
            exitPrice: position?.exitPrice || undefined,
            pnl,
            pnlPercentage,
            timestamp:
              position.openPosition?.ts ||
              position.createdAt?.toString() ||
              new Date().toISOString(),
            openTx: position.openPosition?.tx || undefined,
            closeTx: position.closePosition?.tx || undefined,
          };
        })
        .filter(Boolean) as HistoryItem[];

      const allHistoryItems = [...orderHistoryItems, ...positionHistoryItems]
        .sort((a, b) => {
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return dateB - dateA;
        })
        .slice(0, limit);

      return {
        success: true,
        data: allHistoryItems,
        total: allHistoryItems.length,
      };
    } catch (error) {
      console.error('Error fetching history:', error);
      return {
        success: false,
        message: 'Failed to fetch history',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
