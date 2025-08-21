import { PositionStatus } from '@baskt/types';
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

export const getPortfolioData = publicProcedure
  .input(portfolioInputSchema)
  .query(async ({ input }) => {
    try {
      const { userId } = input;

      const allUserPositions = await querier.position.getPositions({ userId });

      if (!allUserPositions || !allUserPositions.data) {
        return {
          success: false,
          message: 'Failed to fetch positions',
          error: allUserPositions.error || 'Unknown error',
        };
      }

      const positions = allUserPositions.data;
      const activePositions = positions.filter(
        (position) => position.status === PositionStatus.OPEN,
      );

      const uniqueBasktIds = Array.from(new Set(positions.map((pos) => pos.basktAddress))).filter(
        Boolean,
      );

      const basktResults = await Promise.all(
        uniqueBasktIds.map((basktId) => querier.baskt.getBasktByAddress(basktId)),
      );

      const basktMap = new Map();
      const basktAddressToBasktMap = new Map();
      const assetMap = new Map();

      basktResults.forEach((basktResult) => {
        if (basktResult.success && basktResult.data) {
          const baskt = basktResult.data;
          basktMap.set(baskt.basktId, baskt);
          basktAddressToBasktMap.set(baskt.basktId, baskt);
          if (baskt.assets) {
            baskt.assets.forEach((asset: any) => {
              assetMap.set(asset.assetId, asset);
            });
          }
        }
      });

      const basktPositions = new Map<string, any[]>();
      const basktMetrics = new Map<string, { openInterest: BN; collateral: BN }>();

      activePositions.forEach((position) => {
        const basktId = position.basktAddress;
        if (basktId) {
          if (!basktPositions.has(basktId)) {
            basktPositions.set(basktId, []);
            basktMetrics.set(basktId, { openInterest: new BN(0), collateral: new BN(0) });
          }
          basktPositions.get(basktId)!.push(position);

          const metrics = basktMetrics.get(basktId)!;
          metrics.openInterest = metrics.openInterest.add(new BN(position.usdcSize || '0'));
          metrics.collateral = metrics.collateral.add(new BN(position.collateral || '0'));
        }
      });

      let totalOpenInterest = new BN(0);
      let totalCollateral = new BN(0);

      for (const metrics of Array.from(basktMetrics.values())) {
        totalOpenInterest = totalOpenInterest.add(metrics.openInterest);
        totalCollateral = totalCollateral.add(metrics.collateral);
      }

      const basktBreakdown = Array.from(basktPositions.entries()).map(([basktId, basktPos]) => {
        const baskt = basktAddressToBasktMap.get(basktId);
        const basktName = baskt?.name || 'Unknown Baskt';
        const metrics = basktMetrics.get(basktId)!;

        const assetImages: string[] = [];
        if (baskt?.assets) {
          baskt.assets.forEach((asset: any) => {
            if (asset.logo || asset.image) {
              assetImages.push(asset.logo || asset.image);
            }
          });
        }

        const totalValuePercentage = totalOpenInterest.gt(new BN(0))
          ? (parseFloat(metrics.openInterest.toString()) /
              parseFloat(totalOpenInterest.toString())) *
            100
          : 0;

        return {
          basktName,
          assets: assetImages,
          totalValuePercentage,
        };
      });

      const assetPortfolioMap = new Map<
        string,
        {
          totalValue: BN;
          assetName: string;
          assetLogo: string;
          assetTicker: string;
          longCount: number;
          shortCount: number;
        }
      >();

      for (const [basktId, basktPos] of Array.from(basktPositions.entries())) {
        const baskt = basktAddressToBasktMap.get(basktId);
        const basktOpenInterest = basktMetrics.get(basktId)!.openInterest;

        if (baskt?.assets) {
          baskt.assets.forEach((asset: any) => {
            const assetId = asset.assetId;
            const weightPercentage = new BN(asset.weight || 0);
            const assetValue = basktOpenInterest.mul(weightPercentage).div(new BN(100));

            if (assetPortfolioMap.has(assetId)) {
              const existing = assetPortfolioMap.get(assetId)!;
              existing.totalValue = existing.totalValue.add(assetValue);

              const hasLongPosition = basktPos.some((pos) => pos.isLong === true);
              const hasShortPosition = basktPos.some((pos) => pos.isLong === false);

              if (hasLongPosition) existing.longCount++;
              if (hasShortPosition) existing.shortCount++;
            } else {
              const hasLongPosition = basktPos.some((pos) => pos.isLong === true);
              const hasShortPosition = basktPos.some((pos) => pos.isLong === false);

              assetPortfolioMap.set(assetId, {
                totalValue: assetValue,
                assetName: asset.name || asset.ticker,
                assetLogo: asset.logo || asset.image,
                assetTicker: asset.ticker || 'UNKNOWN',
                longCount: hasLongPosition ? 1 : 0,
                shortCount: hasShortPosition ? 1 : 0,
              });
            }
          });
        }
      }

      const assetBreakdown = Array.from(assetPortfolioMap.entries())
        .map(([assetId, assetData]) => {
          const assetPercentage = totalOpenInterest.gt(new BN(0))
            ? assetData.totalValue.mul(new BN(100)).div(totalOpenInterest).toNumber()
            : 0;

          return {
            assetId,
            assetName: assetData.assetName,
            assetLogo: assetData.assetLogo,
            assetTicker: assetData.assetTicker,
            totalValue: assetData.totalValue.toString(),
            portfolioPercentage: parseFloat(assetPercentage.toFixed(2)),
            longCount: assetData.longCount,
            shortCount: assetData.shortCount,
          };
        })
        .sort((a, b) => b.portfolioPercentage - a.portfolioPercentage);

      const positionData = activePositions.map((position) => {
        const basktId = position.basktAddress;
        const baskt = basktAddressToBasktMap.get(basktId);
        const basktName = baskt?.name || 'Unknown Baskt';
        const currentPrice = baskt?.price || 0;

        let pnl = new BN(0);
        let pnlPercentage = 0;

        const entryPrice = new BN(position.entryPrice || 0);
        const usdcSize = new BN(position.usdcSize || '0');
        const isLong = position.isLong;
        const collateral = new BN(position.collateral || '0');

        if (entryPrice.gt(new BN(0)) && currentPrice > 0 && usdcSize.gt(new BN(0))) {
          const currentPriceBN = new BN(Math.floor(currentPrice * 1e6));
          const positionSize = usdcSize.mul(new BN(1e6)).div(entryPrice);
          const currentValue = positionSize.mul(currentPriceBN).div(new BN(1e6));
          const entryValue = usdcSize;

          if (isLong) {
            pnl = currentValue.sub(entryValue);
          } else {
            pnl = entryValue.sub(currentValue);
          }

          pnlPercentage = collateral.gt(new BN(0))
            ? pnl.mul(new BN(100)).div(collateral).toNumber()
            : 0;
        }

        return {
          basktId,
          basktName,
          type: position.isLong ? 'long' : 'short',
          positionValue: position.usdcSize || '0',
          entryPrice: position.entryPrice || '0',
          currentPrice: currentPrice.toString(),
          pnl: pnl.toString(),
          pnlPercentage: Number(pnlPercentage.toFixed(2)),
          size: position.usdcSize || '0',
          collateral: position.collateral || '0',
          timestamp: position.createdAt?.toISOString() || new Date().toISOString(),
        };
      });

      let totalPnlValue = new BN(0);
      if (input.includeHistory) {
        for (const position of positions) {
          const positionPnl = new BN((position as any).pnl || '0');
          totalPnlValue = totalPnlValue.add(positionPnl);
        }
      }

      const metrics = {
        totalPortfolioValue: totalOpenInterest.toString(),
        totalOpenInterest: totalOpenInterest.toString(),
        totalCollateral: totalCollateral.toString(),
        totalPnl: totalPnlValue.div(new BN(1e6)).toString(),
        totalPnlPercentage: totalCollateral.gt(new BN(0))
          ? totalPnlValue.mul(new BN(100)).div(totalCollateral).toNumber()
          : 0,
        totalPositions: activePositions.length,
      };

      return {
        success: true,
        data: {
          basktBreakdown,
          assetBreakdown,
          positions: positionData,
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
