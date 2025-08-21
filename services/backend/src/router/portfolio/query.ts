import { OnchainOrderStatus } from '@baskt/types';
import BN from 'bn.js';
import { z } from 'zod';
import { publicProcedure } from '../../trpc/trpc';
import { querier } from '../../utils/';
import logger from '../../utils/logger';
import { PositionStatus } from '@baskt/types';

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
      const { userId } = input;

      // First fetch user positions to identify which baskts we need
      const allUserPositions = await querier.position.getPositions({ userId });

      if (!allUserPositions || !allUserPositions.data) {
        return {
          success: false,
          message: 'Failed to fetch positions',
          error: allUserPositions.error || 'Unknown error',
        };
      }

      const activePositions = allUserPositions.data?.filter((position) => position.status === PositionStatus.OPEN);
      const positions = activePositions;
      const allPositionsData = allUserPositions.data;

      // Extract unique baskt IDs from user's positions
      const uniqueBasktIds = [...new Set(allUserPositions.data.map(pos => pos.basktAddress))].filter(Boolean);

      // Fetch only the baskts that the user has positions in
      const basktResults = await Promise.all(
        uniqueBasktIds.map(basktId => querier.baskt.getBasktByAddress(basktId))
      );

      // Create lookup maps for baskts and assets
      const basktMap = new Map();
      const assetMap = new Map();
      
      basktResults.forEach((basktResult) => {
        if (basktResult.success && basktResult.data) {
          const baskt = basktResult.data;
          basktMap.set(baskt.basktId, baskt);
          // Also create asset lookup map
          if (baskt.assets) {
            baskt.assets.forEach((asset: any) => {
              assetMap.set(asset.assetId, asset);
            });
          }
        }
      });

      // Group positions by baskt
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

      // Calculate portfolio metrics
      let totalOpenInterest = new BN(0);
      let totalCollateral = new BN(0);

      for (const basktPos of basktPositions.values()) {
        const basktOpenInterest = basktPos.reduce((sum, pos) => {
          return sum.add(new BN(pos.usdcSize || '0'));
        }, new BN(0));

        const basktCollateral = basktPos.reduce((sum, pos) => {
          return sum.add(new BN(pos.collateral || '0'));
        }, new BN(0));

        totalOpenInterest = totalOpenInterest.add(basktOpenInterest);
        totalCollateral = totalCollateral.add(basktCollateral);
      }

      // Build baskt breakdown
      const basktBreakdown: any[] = [];
      for (const [basktId, basktPos] of basktPositions.entries()) {
        const basktOpenInterest = basktPos.reduce((sum, pos) => {
          return sum.add(new BN(pos.usdcSize || '0'));
        }, new BN(0));

        const baskt = basktMap.get(basktId);
        const basktName = baskt?.name || 'Unknown Baskt';

        const assetImages: string[] = [];
        if (baskt?.assets) {
          baskt.assets.forEach((asset: any) => {
            if (asset.logo || asset.image) {
              assetImages.push(asset.logo || asset.image);
            }
          });
        }

        const totalValuePercentage = totalOpenInterest.gt(new BN(0))
          ? (parseFloat(basktOpenInterest.toString()) / parseFloat(totalOpenInterest.toString())) * 100
          : 0;

        basktBreakdown.push({
          basktName,
          assets: assetImages,
          totalValuePercentage,
        });
      }

      // Build asset breakdown
      const assetPortfolioMap = new Map<string, {
        totalValue: BN;
        assetName: string;
        assetLogo: string;
        assetTicker: string;
      }>();

      for (const [basktId, basktPos] of basktPositions.entries()) {
        const basktOpenInterest = basktPos.reduce((sum, pos) => {
          return sum.add(new BN(pos.usdcSize || '0'));
        }, new BN(0));

        const baskt = basktMap.get(basktId);
        if (baskt?.assets) {
          baskt.assets.forEach((asset: any) => {
            const assetId = asset.assetId;
            const weightPercentage = new BN(asset.weight || 0);
            const assetValue = basktOpenInterest.mul(weightPercentage).div(new BN(100));

            if (assetPortfolioMap.has(assetId)) {
              assetPortfolioMap.get(assetId)!.totalValue = assetPortfolioMap.get(assetId)!.totalValue.add(assetValue);
            } else {
              assetPortfolioMap.set(assetId, {
                totalValue: assetValue,
                assetName: asset.name || asset.ticker,
                assetLogo: asset.logo || asset.image,
                assetTicker: asset.ticker || 'UNKNOWN',
              });
            }
          });
        }
      }

      const assetBreakdown: any[] = [];
      for (const [assetId, assetData] of assetPortfolioMap.entries()) {
        const assetPercentage = totalOpenInterest.gt(new BN(0))
          ? assetData.totalValue.mul(new BN(100)).div(totalOpenInterest).toNumber()
          : 0;

        // Count long/short positions for this asset
        let longCount = 0;
        let shortCount = 0;
        const countedBaskets = new Set();

        for (const [basktId, basktPos] of basktPositions.entries()) {
          if (countedBaskets.has(basktId)) continue;

          for (const pos of basktPos) {
            const baskt = basktMap.get(basktId);
            if (baskt?.assets) {
              const basktAsset = baskt.assets.find(
                (asset: any) => asset.assetId === assetId
              );

              if (basktAsset && Number(basktAsset.weight) > 0) {
                if (pos.isLong === true) longCount++;
                else if (pos.isLong === false) shortCount++;
                countedBaskets.add(basktId);
                break;
              }
            }
          }
        }

        assetBreakdown.push({
          assetId,
          assetName: assetData.assetName,
          assetLogo: assetData.assetLogo,
          assetTicker: assetData.assetTicker,
          totalValue: assetData.totalValue.toString(),
          portfolioPercentage: parseFloat(assetPercentage.toFixed(2)),
          longCount,
          shortCount,
        });
      }

      assetBreakdown.sort((a, b) => b.portfolioPercentage - a.portfolioPercentage);

      // Build position data
      const positionData: any[] = [];
      for (const position of positions) {
        const basktId = position.basktAddress;
        
        const baskt = basktMap.get(basktId);
        const basktName = baskt?.name || 'Unknown Baskt';
        const currentPrice = baskt?.price || 0;

        // Calculate PnL using BN math
        let pnl = new BN(0);
        let pnlPercentage = 0;

        const entryPrice = new BN(position.entryPrice || 0);
        const usdcSize = new BN(position.usdcSize || '0');
        const isLong = position.isLong;
        const collateral = new BN(position.collateral || '0');

        if (entryPrice.gt(new BN(0)) && currentPrice > 0 && usdcSize.gt(new BN(0))) {
          const currentPriceBN = new BN(Math.floor(currentPrice * 1e6)); // Convert to 6 decimal places
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

        positionData.push({
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
        });
      }

      // Calculate total PnL from all positions (including closed ones)
      let totalPnlValue = new BN(0);
      if (allPositionsData) {
        for (const position of allPositionsData) {
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
        totalPositions: positions.length,
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
