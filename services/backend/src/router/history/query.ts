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
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }),
  )
  .query(async ({ input }) => {
    try {
      const { basktId, userId, status, action, limit, offset } = input;

      const orderFilter: any = {};
      const positionFilter: any = {};

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

      const orders = await OrderMetadataModel.find(orderFilter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      const positions = await PositionMetadataModel.find(positionFilter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset)
        .lean();

      const allBasktIds = [...orders.map((o) => o.basktId), ...positions.map((p) => p.basktId)];
      const basktIds = Array.from(new Set(allBasktIds));

      const basktNames = await BasktMetadataModel.find({
        basktId: { $in: basktIds },
      }).lean();

      const basktNameMap = new Map(basktNames.map((b) => [b.basktId, b.name]));

      const orderHistoryItems: HistoryItem[] = orders.map((order) => ({
        id: order.orderPDA,
        type: 'order',
        orderId: order.orderId,
        basktId: order.basktId,
        basktName: basktNameMap.get(order.basktId),
        owner: order.owner,
        action: order.orderAction,
        status: order.orderStatus,
        size: order.size,
        collateral: order.size,
        isLong: order.isLong,
        entryPrice: order.entryPrice || undefined,
        exitPrice: order.exitPrice || undefined,
        timestamp: order.createOrder?.ts || order.createdAt?.toString() || '',
        createTx: order.createOrder?.tx,
        fillTx: order.fullFillOrder?.tx || undefined,
      }));

      const positionHistoryItems: HistoryItem[] = positions.map((position) => {
        let pnl: string | undefined;
        let pnlPercentage: string | undefined;

        if (position.status === PositionStatus.CLOSED && position.closePosition?.exitPrice) {
          const entryPrice = parseFloat(position.entryPrice);
          const exitPrice = parseFloat(position.closePosition.exitPrice);
          const size = parseFloat(position.size);

          if (position.isLong) {
            pnl = ((exitPrice - entryPrice) * size).toString();
          } else {
            pnl = ((entryPrice - exitPrice) * size).toString();
          }

          const pnlValue = parseFloat(pnl);
          const collateral = parseFloat(position.collateral);
          pnlPercentage = ((pnlValue / collateral) * 100).toFixed(2);
        }

        return {
          id: position.positionPDA,
          type: 'position',
          positionId: position.positionId,
          basktId: position.basktId,
          basktName: basktNameMap.get(position.basktId),
          owner: position.owner,
          action: position.isLong ? OrderAction.Open : OrderAction.Close,
          status: position.status,
          size: position.size,
          collateral: position.collateral,
          isLong: position.isLong,
          entryPrice: position.entryPrice,
          exitPrice: position.closePosition?.exitPrice,
          pnl,
          pnlPercentage,
          timestamp: position.openPosition?.ts || position.createdAt?.toString() || '',
          openTx: position.openPosition?.tx,
          closeTx: position.closePosition?.tx,
        };
      });

      const allHistoryItems = [...orderHistoryItems, ...positionHistoryItems]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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
