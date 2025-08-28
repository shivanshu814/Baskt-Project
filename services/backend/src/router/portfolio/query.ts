import { PositionStatus } from '@baskt/types';
import BN from 'bn.js';
import { z } from 'zod';
import { protectedProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';
import logger from '../../utils/logger';
import { CombinedBaskt, CombinedBasktAsset, CombinedPosition } from '@baskt/querier';
import { PRICE_PRECISION } from '@baskt/sdk';

const portfolioInputSchema = z.object({
  userId: z.string(),
  includeOrders: z.boolean().default(true),
  includeHistory: z.boolean().default(true),
});


const getCurrentUserPositions = (activePositions: CombinedPosition[], basktAddressToBasktMap: Map<string, CombinedBaskt>) => {
  const positionData = activePositions.map((position) => {
    const basktId = position.basktAddress;
    const baskt = basktAddressToBasktMap.get(basktId);
    const basktName = baskt!.name;
    const currentPrice = baskt!.price;

    let pnl = new BN(0);
    let pnlPercentage = 0;

    const entryPrice = new BN(position.entryPrice);
    const usdcSize = new BN(position.usdcSize);
    const isLong = position.isLong;
    const collateral = new BN(position.collateral);

    if (entryPrice.gt(new BN(0)) && currentPrice > 0 && usdcSize.gt(new BN(0))) {
      const currentPriceBN = new BN(currentPrice);
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
      isLong: position.isLong,
      positionValue: position.usdcSize,
      entryPrice: position.entryPrice,
      currentPrice: currentPrice.toString(),
      pnl: pnl.toString(),
      pnlPercentage: Number(pnlPercentage.toFixed(2)),
      size: position.usdcSize,
      collateral: position.collateral,
      timestamp: position.createdAt?.toISOString() || new Date().toISOString(),
    };
  });
  return positionData;
}
export const getPortfolioData = protectedProcedure
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
      const basktAddressToBasktMap = new Map<string, CombinedBaskt>();
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
      const basktMetrics = new Map<string, { longOpenInterest: BN; shortOpenInterest: BN; totalOpenInterest: BN; collateral: BN }>();
      let totalOpenInterest = new BN(0);
      let totalCollateral = new BN(0);

      // Calculate total open interest and collateral, and baskt breakdown 
      activePositions.forEach((position) => {
        const basktId = position.basktAddress;
        if (basktId) {
          if (!basktPositions.has(basktId)) {
            basktPositions.set(basktId, []);
            basktMetrics.set(basktId, { longOpenInterest: new BN(0), shortOpenInterest: new BN(0), totalOpenInterest: new BN(0), collateral: new BN(0) });
          }
          basktPositions.get(basktId)!.push(position);

          const metrics = basktMetrics.get(basktId)!;
          const openInterest = new BN(position.usdcSize);
          const collateral = new BN(position.collateral);
          metrics.longOpenInterest = position.isLong ? metrics.longOpenInterest.add(openInterest) : metrics.longOpenInterest;
          metrics.shortOpenInterest = position.isLong ? metrics.shortOpenInterest : metrics.shortOpenInterest.add(openInterest);
          metrics.totalOpenInterest = metrics.longOpenInterest.add(metrics.shortOpenInterest);
          metrics.collateral = metrics.collateral.add(collateral);

          totalOpenInterest = totalOpenInterest.add(openInterest);
          totalCollateral = totalCollateral.add(collateral);
        }
      });

      const basktBreakdown = Array.from(basktPositions.entries()).map(([basktId]) => {
        const baskt = basktAddressToBasktMap.get(basktId);
        const basktName = baskt!.name;
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
          ? (parseFloat(metrics.totalOpenInterest.toString()) /
            parseFloat(totalOpenInterest.toString())) *
          100
          : 0;

        return {
          basktName,
          assets: assetImages,
          totalValue: metrics.totalOpenInterest.toString(),
          longOpenInterest: metrics.longOpenInterest.toString(),
          shortOpenInterest: metrics.shortOpenInterest.toString(),
          totalValuePercentage,
        };
      });

      const assetPortfolioMap = new Map<
        string,
        {
          totalValue: BN;
          longOpenInterest: BN;
          shortOpenInterest: BN;
          assetName: string;
          assetLogo: string;
          assetTicker: string;
        }
      >();

      for (const [basktId, basktPositionList] of Array.from(basktPositions.entries())) {
        const baskt = basktAddressToBasktMap.get(basktId);
        if (!baskt) continue;
        baskt.assets.forEach((asset: CombinedBasktAsset) => {

          for (const position of basktPositionList) {
            const isLong = position.isLong == asset.direction;
            const positionValue = new BN(position.size).mul(new BN(baskt.price)).div(new BN(PRICE_PRECISION));

            const assetId = asset.assetAddress;
            const weightPercentage = new BN(asset.weight || 0);
            const assetValue = positionValue.mul(weightPercentage).div(new BN(100));
            const currentAssetData = assetPortfolioMap.get(assetId) || {
              totalValue: new BN(0),
              longOpenInterest: new BN(0),
              shortOpenInterest: new BN(0),
              assetName: '',
              assetLogo: '',
              assetTicker: '',
            };

            assetPortfolioMap.set(assetId, {
              totalValue: currentAssetData!.totalValue.add(assetValue),
              longOpenInterest: isLong ? currentAssetData!.longOpenInterest.add(assetValue) : currentAssetData!.longOpenInterest,
              shortOpenInterest: isLong ? currentAssetData!.shortOpenInterest : currentAssetData!.shortOpenInterest.add(assetValue),
              assetName: asset.name,
              assetLogo: asset.logo,
              assetTicker: asset.ticker,
            });
          }



        });


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
              longOpenInterest: assetData.longOpenInterest.toString(),
              shortOpenInterest: assetData.shortOpenInterest.toString(),
              portfolioPercentage: assetPercentage.toString(),
            };
          })
          .sort((a, b) => b.portfolioPercentage > a.portfolioPercentage ? 1 : -1);


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
            positions: getCurrentUserPositions(activePositions, basktAddressToBasktMap),
            metrics,
          },
        };
      }
    } catch (error) {
      logger.error('Error fetching portfolio data:', error);
      return {
        success: false,
        message: 'Failed to fetch portfolio data',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
