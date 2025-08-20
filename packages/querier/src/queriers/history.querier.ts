import { metadataManager } from '../models/metadata-manager';
import { HistoryItem, OrderAction, PositionStatus } from '@baskt/types';
import { HistoryQueryParams, HistoryResult } from '../types/history';

/**
 * HistoryQuerier
 *
 * This class is responsible for fetching the history of orders and positions.
 * It is used to fetch the history of orders and positions.
 */

// TODO: @nshmadhani We need to redo this 
export class HistoryQuerier {
  // get history of orders and positions
  async getHistory(params: HistoryQueryParams): Promise<HistoryResult> {
    try {
      const { basktId, userId, status, action, limit = 50, offset = 0 } = params;

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

      const allOrders = await metadataManager.getAllOrders();
      const allPositions = await metadataManager.getAllPositions();

      const filteredOrders = basktId ? allOrders.filter((o) => o.basktAddress === basktId) : allOrders;
      const filteredPositions = basktId
        ? allPositions.filter((p) => p.basktAddress === basktId)
        : allPositions;

      const allBasktIds = [
        ...filteredOrders.map((o: any) => o.basktId).filter(Boolean),
        ...filteredPositions.map((p: any) => p.basktId).filter(Boolean),
      ];
      const basktIds = Array.from(new Set(allBasktIds));

      let basktNameMap = new Map<string, string>();
      if (basktIds.length > 0) {
        const basktNames = await metadataManager.getAllBaskts();
        const filteredBasktNames = basktNames.filter((b: any) => basktIds.includes(b.basktId));
        basktNameMap = new Map(filteredBasktNames.map((b: any) => [b.basktId, b.name]));
      }

      const orderHistoryItems: HistoryItem[] = allOrders.map((order) => {
        let pnl: string | undefined;
        let pnlPercentage: string | undefined;

        if (
          order.orderStatus === 'FILLED' &&
          order.orderAction === OrderAction.Close &&
          order.limitParams?.limitPrice
        ) {
          try {
            const correspondingPosition = allPositions.find(
              (pos) =>
                pos.positionId === order.positionAddress ||
                (pos.owner === order.owner &&
                  pos.basktAddress === order.basktAddress &&
                  pos.status === PositionStatus.CLOSED),
            );

            if (correspondingPosition && correspondingPosition.entryPrice) {
              const entryPrice = parseFloat(correspondingPosition.entryPrice || '0');
              const exitPrice = parseFloat(order.limitParams?.limitPrice || '0');
              const size = parseFloat(order.openParams?.notionalValue || '0');

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
          orderId: order.orderId,
          basktId: order.basktAddress,
          basktName: basktNameMap.get(order.basktAddress) || '',
          owner: order.owner || '',
          action: order.orderAction || OrderAction.Open,
          status: order.orderStatus || '',
          size: order.openParams?.notionalValue || '0',
          collateral: order.openParams?.collateral || '0',
          isLong: order.openParams?.isLong || false,
          entryPrice: order.limitParams?.limitPrice || undefined,
          exitPrice: order.limitParams?.limitPrice || undefined,
          pnl,
          pnlPercentage,
          timestamp:
            order.createOrder?.ts || order.createdAt?.toString() || new Date().toISOString(),
          createTx: order.createOrder?.tx || undefined,
          fillTx: order.fullFillOrder?.tx || undefined,
        };
      });

      const positionHistoryItems: HistoryItem[] = allPositions
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
            basktId: position.basktAddress || '',
            basktName: basktNameMap.get(position.basktAddress) || '',
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

      const allHistoryItems = [...orderHistoryItems, ...positionHistoryItems].sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return dateB - dateA;
      });

      const paginatedItems = allHistoryItems.slice(offset, offset + limit);

      return {
        success: true,
        data: paginatedItems,
      };
    } catch (error) {
      console.error('Error fetching history:', error);
      return {
        success: false,
        error: 'Failed to fetch history',
      };
    }
  }
}
