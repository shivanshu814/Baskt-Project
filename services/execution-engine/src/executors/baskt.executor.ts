import { BasktCreatedMessage, logger } from '@baskt/data-bus';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { basktClient, querierClient } from '../config/client';
import { BasktStatus, OnchainAssetConfig, OnchainBasktAccount } from '@baskt/types';
import { CombinedAsset } from '@baskt/querier';
import { NAV_PRECISION } from '@baskt/sdk';



export class BasktExecutor {
  /**
   * Activate a newly created baskt by setting baseline prices
   * Based on baskt-created.ts handler logic
   */
  async activateBaskt(basktCreatedMessage: BasktCreatedMessage): Promise<string> {
    const {basktId } = basktCreatedMessage;
    try {
      logger.info('Activating baskt', { basktId });

      // Fetch the on-chain baskt account
      const onchainBaskt = await basktClient.readWithRetry(
        async () => await basktClient.getBasktAccount(new PublicKey(basktId), 'confirmed'),
        3,   // max attempts
        1500 // 1.5s between attempts
      ) as OnchainBasktAccount;

      // Get asset configurations from the baskt
      const onchainAssetList = onchainBaskt.currentAssetConfigs;
      // Fetch asset data from querier
      const assetsResult = await querierClient.asset.getAssetsByAddress(
        onchainAssetList.map((assetConfig: OnchainAssetConfig) => assetConfig.assetId.toString()),
        {}
      );

      if (!assetsResult.success || !assetsResult.data || assetsResult.data.length === 0) {
        throw new Error('No assets found for baskt activation');
      }

      const assets = assetsResult.data;
      const activeAssets = assets.filter(
        (asset: CombinedAsset) => asset.price > 0 && asset.isActive
      );

      if (activeAssets.length !== onchainAssetList.length) {
        throw new Error(
          `Asset count mismatch: expected ${onchainAssetList.length}, found ${activeAssets.length} active assets`
        );
      }
      
      const assetLookup = new Map<string, CombinedAsset>();
      activeAssets.forEach((asset: CombinedAsset) => {
        assetLookup.set(asset.assetAddress.toLowerCase(), asset);
      });

      // Sort and map baseline prices according to asset config
      const baselinePrices = onchainAssetList.map((asset: OnchainAssetConfig) => {
        const mappedAsset = assetLookup.get(asset.assetId.toString().toLowerCase());
        return new BN(Math.floor(mappedAsset?.price || 0));
      });

      // Execute baskt activation on-chain
      const tx = await basktClient.activateBaskt(new PublicKey(basktId), baselinePrices);
      await this.createBasktMetadata(onchainBaskt, onchainAssetList, assetLookup, basktId, onchainBaskt.uid.toString(), basktCreatedMessage.txSignature, tx);
      
      logger.info('Baskt activated successfully', { basktId, tx, txSignature: basktCreatedMessage.txSignature, uid: onchainBaskt.uid.toString() });

      return tx;
    } catch (error) {
      logger.error('Failed to activate baskt', {
        basktId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Private helper to create baskt metadata
   */
  private async createBasktMetadata(
    basktAccount: OnchainBasktAccount,
    currentAssetConfigs: OnchainAssetConfig[],
    assetLookup: Map<string, CombinedAsset>,
    basktId: string,
    name: string,
    createTxSignature: string, 
    activateTxSignature: string,
  ){
    try {
      const result = await querierClient.metadata.createBaskt({ 
        basktId: basktId.toString(),
        name: name,
        uid: Number(basktAccount.uid.toString()),
        creator: basktAccount.creator.toString(),
        creationTxSignature: createTxSignature,
        currentAssetConfigs: currentAssetConfigs.map((asset: OnchainAssetConfig) => ({
          assetObjectId: assetLookup.get(asset.assetId.toString().toLowerCase())!._id!.toString(),
          assetId: asset.assetId.toString(),
          direction: asset.direction,
          weight: asset.weight.toNumber(),
          baselinePrice: new BN(assetLookup.get(asset.assetId.toString().toLowerCase())!.price),
        })),
        isPublic: basktAccount.isPublic,
        status: BasktStatus.Active,
        openPositions: 0,
        lastRebalanceTime: Number(basktAccount.lastRebalanceTime.toString()),
        baselineNav: NAV_PRECISION,
        rebalancePeriod: Number(basktAccount.rebalancePeriod.toString()),
        config: {
          openingFeeBps: basktAccount.config.openingFeeBps ? Number(basktAccount.config.openingFeeBps.toString()) : undefined,
          closingFeeBps: basktAccount.config.closingFeeBps ? Number(basktAccount.config.closingFeeBps.toString()) : undefined,
          liquidationFeeBps: basktAccount.config.liquidationFeeBps ? Number(basktAccount.config.liquidationFeeBps.toString()) : undefined,
          minCollateralRatioBps: basktAccount.config.minCollateralRatioBps ? Number(basktAccount.config.minCollateralRatioBps.toString()) : undefined,
          liquidationThresholdBps: basktAccount.config.liquidationThresholdBps ? Number(basktAccount.config.liquidationThresholdBps.toString()) : undefined,
        },
        fundingIndex: {
          cumulativeIndex: new BN(basktAccount.fundingIndex.cumulativeIndex),
          lastUpdateTimestamp: Number(basktAccount.fundingIndex.lastUpdateTimestamp.toString()),
          currentRate: Number(basktAccount.fundingIndex.currentRate.toString()),
        },
        rebalanceFeeIndex: {
          cumulativeIndex: new BN(basktAccount.rebalanceFeeIndex.cumulativeIndex),
          lastUpdateTimestamp: Number(basktAccount.rebalanceFeeIndex.lastUpdateTimestamp.toString()),
        },
        stats: {
          change24h: 0,
          change7d: 0,
          change30d: 0,
          change365d: 0,
          longAllTimeVolume: new BN(0),
          shortAllTimeVolume: new BN(0),
          longOpenInterestContracts: new BN(0),
          shortOpenInterestContracts: new BN(0),
        },
        activateBasktTxSignature: activateTxSignature,
        decomissionBasktTxSignature: '',
        closeBasktTxSignature: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return result;
    } catch (error) {
      console.error('Error creating baskt metadata:', error);
      throw error;
    }
  }
}
