import { OnchainOrderStatus } from '@baskt/types';
import BN from 'bn.js';
import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';
import logger from '../../utils/logger';

const portfolioInputSchema = z.object({
  userId: z.string(),
  includeOrders: z.boolean().default(true),
  includeHistory: z.boolean().default(true),
});

// portfolio query function
export const getPortfolioData = publicProcedure
  .input(portfolioInputSchema)
  .query(async ({ input }) => {
    try {
      const { userId, includeOrders, includeHistory } = input;

      const positionsResult = await querier.position.getPositions({
        userId,
        isActive: true,
      });

      if (!positionsResult.success || !positionsResult.data) {
        return {
          success: false,
          message: 'Failed to fetch positions',
          error: positionsResult.error || 'Unknown error',
        };
      }

      const positions = positionsResult.data;

      const basktPositions = new Map<string, any[]>();

      positions.forEach((position) => {
        const basktId = position.basktAddress;

        if (basktId) {
          if (!basktPositions.has(basktId)) {
            basktPositions.set(basktId, []);
          }
          basktPositions.get(basktId)!.push(position);
        }
      });

      const basktBreakdown: any[] = [];
      let totalOpenInterest = new BN(0);
      let totalCollateral = new BN(0);
      let totalPnl = new BN(0);

      for (const [basktId, basktPos] of Array.from(basktPositions.entries())) {
        const basktOpenInterest = basktPos.reduce((sum, pos) => {
          return sum.add(new BN(pos.usdcSize || '0'));
        }, new BN(0));

        const basktCollateral = basktPos.reduce((sum, pos) => {
          return sum.add(new BN(pos.collateral || '0'));
        }, new BN(0));

        const basktPnl = basktPos.reduce((sum, pos) => {
          const pnl = new BN(pos.pnl || '0');
          return sum.add(pnl);
        }, new BN(0));

        totalOpenInterest = totalOpenInterest.add(basktOpenInterest);
        totalCollateral = totalCollateral.add(basktCollateral);
        totalPnl = totalPnl.add(basktPnl);

        const basktResult = await querier.baskt.getBasktByAddress(basktId);
        const basktName =
          basktResult.success && basktResult.data ? basktResult.data.name : 'Unknown Baskt';

        const assetImages: string[] = [];
        if (basktResult.success && basktResult.data && basktResult.data.assets) {
          basktResult.data.assets.forEach((asset: any) => {
            if (asset.logo || asset.image) {
              assetImages.push(asset.logo || asset.image);
            }
          });
        }

        basktBreakdown.push({
          basktId,
          basktName,
          assets: assetImages,
          totalValuePercentage: 0,
        });
      }

      for (let i = 0; i < basktBreakdown.length; i++) {
        const baskt = basktBreakdown[i];
        const basktOpenInterest =
          basktPositions.get(baskt.basktId || '')?.reduce((sum, pos) => {
            return sum.add(new BN(pos.usdcSize || '0'));
          }, new BN(0)) || new BN(0);

        if (totalOpenInterest.gt(new BN(0))) {
          baskt.totalValuePercentage =
            (parseFloat(basktOpenInterest.toString()) / parseFloat(totalOpenInterest.toString())) *
            100;
        }

        delete baskt.basktId;
      }

      const assetBreakdown: any[] = [];
      const assetPortfolioMap = new Map<
        string,
        {
          totalValue: number;
          assetName: string;
          assetLogo: string;
          assetTicker: string;
        }
      >();

      for (const [basktId, basktPos] of Array.from(basktPositions.entries())) {
        const basktOpenInterest = parseFloat(
          basktPos
            .reduce((sum, pos) => {
              return sum.add(new BN(pos.usdcSize || '0'));
            }, new BN(0))
            .toString(),
        );

        const basktResult = await querier.baskt.getBasktByAddress(basktId);
        if (basktResult.success && basktResult.data && basktResult.data.assets) {
          basktResult.data.assets.forEach((asset: any) => {
            const assetId = asset.assetId || asset.id;
            const assetName = asset.name || asset.ticker;
            const assetLogo = asset.logo || asset.image;
            const assetTicker = asset.ticker || 'UNKNOWN';
            const weight = asset.weight || 0;

            const weightPercentage = weight / 100;

            const assetValue = basktOpenInterest * weightPercentage;

            if (assetPortfolioMap.has(assetId)) {
              const existing = assetPortfolioMap.get(assetId)!;
              existing.totalValue += assetValue;
            } else {
              assetPortfolioMap.set(assetId, {
                totalValue: assetValue,
                assetName,
                assetLogo,
                assetTicker,
              });
            }
          });
        }
      }

      for (const [assetId, assetData] of Array.from(assetPortfolioMap.entries())) {
        const totalPortfolioValue = parseFloat(totalOpenInterest.toString());
        const assetPercentage =
          totalPortfolioValue > 0 ? (assetData.totalValue / totalPortfolioValue) * 100 : 0;

        let longCount = 0;
        let shortCount = 0;

        const countedBaskets = new Set();

        for (const [basktId, basktPos] of Array.from(basktPositions.entries())) {
          if (countedBaskets.has(basktId)) {
            continue;
          }

          for (const pos of basktPos) {
            const basktResult = await querier.baskt.getBasktByAddress(basktId);
            if (basktResult.success && basktResult.data && basktResult.data.assets) {
              const basktAsset = basktResult.data.assets.find(
                (asset: any) => asset.assetId === assetId || asset.id === assetId,
              );

              if (basktAsset) {
                const assetWeight = Number(basktAsset.weight) || 0;

                if (assetWeight > 0) {
                  if (pos.isLong === true) {
                    longCount++;
                  } else if (pos.isLong === false) {
                    shortCount++;
                  }
                  countedBaskets.add(basktId);
                  break;
                }
              }
            }
          }
        }

        assetBreakdown.push({
          assetId,
          assetName: assetData.assetName,
          assetLogo: assetData.assetLogo,
          assetTicker: assetData.assetTicker,
          totalValue: assetData.totalValue.toFixed(2),
          portfolioPercentage: parseFloat(assetPercentage.toFixed(2)),
          longCount: longCount,
          shortCount: shortCount,
        });
      }

      assetBreakdown.sort((a, b) => b.portfolioPercentage - a.portfolioPercentage);

      const positionData: any[] = [];

      for (const position of positions) {
        const basktId = position.basktAddress;
        let basktName = 'Unknown Baskt';
        const basktNameResult = await querier.baskt.getBasktByAddress(basktId);
        if (basktNameResult.success && basktNameResult.data) {
          basktName = basktNameResult.data.name || 'Unknown Baskt';
        }

        const basktResult = await querier.baskt.getBasktByAddress(basktId);
        const currentPrice =
          basktResult.success && basktResult.data ? Number(basktResult.data.price || 0) : 0;

        let pnl = 0;
        let pnlPercentage = 0;

        const entryPrice = position.entryPrice;
        const usdcSize = parseFloat(position.usdcSize.toString());
        const isLong = position.isLong;
        const collateral = parseFloat(position.collateral.toString());

        if (entryPrice > 0 && currentPrice > 0 && usdcSize > 0) {
          const positionSize = usdcSize / entryPrice;
          const currentValue = positionSize * currentPrice;
          const entryValue = usdcSize;

          if (isLong) {
            pnl = currentValue - entryValue;
          } else {
            pnl = entryValue - currentValue;
          }

          pnlPercentage = collateral > 0 ? (pnl / collateral) * 100 : 0;
        }

        positionData.push({
          basktId,
          basktName,
          type: position.isLong ? 'long' : 'short',
          positionValue: position.usdcSize || '0',
          entryPrice: position.entryPrice || '0',
          currentPrice: currentPrice.toString(),
          pnl: pnl.toString(),
          pnlPercentage: Number(pnlPercentage.toFixed(2)),
          size: position.size || '0',
          collateral: position.collateral || '0',
          timestamp: position.createdAt?.toISOString() || new Date().toISOString(),
        });
      }

      let openOrders: any[] = [];
      if (includeOrders) {
        const ordersResult = await querier.order.getOrders({
          userId,
          orderStatus: OnchainOrderStatus.PENDING,
        });

        if (ordersResult.success && ordersResult.data) {
          for (const order of ordersResult.data) {
            const basktId = order.basktAddress;

            let basktName = 'Unknown Baskt';
            let currentPrice = '0';

            const basktResult = await querier.baskt.getBasktByAddress(basktId);
            if (basktResult.success && basktResult.data) {
              basktName = basktResult.data.name || 'Unknown Baskt';
              currentPrice = (basktResult.data.price || 0).toString();
            }

            let size = '0';

            if (order.orderAction === 'OPEN' && order.openParams?.notionalValue) {
              const notionalValue = parseFloat(order.openParams.notionalValue.toString()  );
              size = notionalValue.toString();
            } else if (order.orderAction === 'CLOSE' && order.closeParams?.sizeAsContracts) {
              const sizeAsContracts = parseFloat(order.closeParams.sizeAsContracts.toString());
              size = sizeAsContracts.toString();
            } else if (order.openParams?.collateral) {
              const collateralValue = parseFloat(order.openParams.collateral.toString());
              size = collateralValue.toString();
            }

            let fees = '0';
            if (order.orderAction === 'OPEN' && size !== '0') {
              const notionalValue = parseFloat(size);
              const openingFeeBps = 20;
              const openingFee = (notionalValue * openingFeeBps) / 10000;
              fees = openingFee.toFixed(6);
            } else if (order.orderAction === 'CLOSE' && size !== '0') {
              const notionalValue = parseFloat(size);
              const closingFeeBps = 15;
              const closingFee = (notionalValue * closingFeeBps) / 10000;
              fees = closingFee.toFixed(6);
            }

            openOrders.push({
              basktId,
              basktName,
              orderTime: order.createOrder?.ts || new Date().toISOString(),
              orderType: order.orderType?.toLowerCase() as 'market' | 'limit',
              direction: order.openParams?.isLong ? 'long' : 'short',
              size: size,
              currentPrice: currentPrice,
              fees: fees,
              orderId: order.orderId?.toString() || order.orderPDA || '',
              status: order.orderStatus || 'PENDING',
            });
          }
        }
      }

      let orderHistory: any[] = [];
      if (includeHistory) {
        const historyResult = await querier.history.getHistory({
          userId,
          limit: 100,
        });

        if (historyResult.success && historyResult.data) {
          for (const item of historyResult.data) {
            const orderItem = item as any;

            const basktId = orderItem.basktId || orderItem.basktAddress || '';
            let basktName = 'Unknown Baskt';
            if (basktId) {
              const basktResult = await querier.baskt.getBasktByAddress(basktId);
              if (basktResult.success && basktResult.data) {
                basktName = basktResult.data.name || 'Unknown Baskt';
              }
            }

            let size = '0';

            if (orderItem.size) {
              const sizeValue = parseFloat(orderItem.size);
              size = sizeValue.toString();
            } else {
            }

            let price = '0';
            if (orderItem.entryPrice) {
              const entryPrice = parseFloat(orderItem.entryPrice);
              price = entryPrice.toString();
            }

            const filledAmount = size;

            let fees = '0';
            if (orderItem.type === 'order') {
              if (orderItem.action === 'OPEN' && orderItem.size) {
                const notionalValue = parseFloat(orderItem.size);
                const openingFeeBps = 20;
                const openingFee = (notionalValue * openingFeeBps) / 10000;
                fees = openingFee.toFixed(6);
              } else if (orderItem.action === 'CLOSE' && orderItem.size) {
                const notionalValue = parseFloat(orderItem.size);
                const closingFeeBps = 15;
                const closingFee = (notionalValue * closingFeeBps) / 10000;
                fees = closingFee.toFixed(6);
              }
            } else if (orderItem.type === 'position') {
              if (orderItem.entryPrice && orderItem.size) {
                const entryPrice = parseFloat(orderItem.entryPrice);
                const size = parseFloat(orderItem.size);
                const notionalValue = size * entryPrice;
                const openingFeeBps = 20;
                const openingFee = (notionalValue * openingFeeBps) / 10000;
                fees = openingFee.toFixed(6);
              }
            }

            let transactionHash = '';

            if (orderItem.fillTx) {
              transactionHash = orderItem.fillTx;
            } else if (orderItem.createTx) {
              transactionHash = orderItem.createTx;
            }

            let orderType = 'market';
            let direction = 'long';

            if (orderItem.type === 'order') {
              orderType = 'market';
            }

            if (orderItem.isLong === false) {
              direction = 'short';
            }

            orderHistory.push({
              basktId,
              basktName,
              orderTime:
                orderItem.createOrder?.ts || orderItem.timestamp || new Date().toISOString(),
              orderType: orderType,
              direction: direction,
              size: size,
              price: price,
              status: orderItem.orderStatus || orderItem.status || 'UNKNOWN',
              filledAmount: filledAmount,
              fees: fees,
              transactionHash: transactionHash,
              orderId: orderItem.orderId?.toString() || orderItem.id || '',
            });
          }
        }
      }

      let totalPnlValue = 0;
      for (const position of positionData) {
        const positionPnl = parseFloat(position.pnl);
        totalPnlValue += positionPnl;
      }

      const metrics = {
        totalPortfolioValue: totalOpenInterest.toString(),
        totalOpenInterest: totalOpenInterest.toString(),
        totalCollateral: totalCollateral.toString(),
        totalPnl: (totalPnlValue / 1e6).toString(),
        totalPnlPercentage: totalCollateral.gt(new BN(0))
          ? (totalPnlValue / parseFloat(totalCollateral.toString())) * 100
          : 0,
        totalPositions: positions.length,
        totalOpenOrders: openOrders.length,
      };

      return {
        success: true,
        data: {
          basktBreakdown,
          assetBreakdown,
          positions: positionData,
          openOrders,
          orderHistory,
          metrics,
        },
      };
    } catch (error) {
      logger.error('Error fetching portfolio data:', error);
      return {
        success: false,
        message: 'Failed to fetch portfolio data',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
