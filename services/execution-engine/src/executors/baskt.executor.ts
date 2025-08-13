import { BasktCreatedMessage, logger } from '@baskt/data-bus';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { basktClient, querierClient } from '../config/client';
import { OnchainAssetConfig, OnchainBasktAccount } from '@baskt/types';
import { CombinedAsset } from '@baskt/querier';

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
        async () => await basktClient.getBasktRaw(new PublicKey(basktId), 'confirmed'),
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
        (asset: CombinedAsset) => asset.price > 0 && asset.account?.isActive
      );

      if (activeAssets.length !== onchainAssetList.length) {
        throw new Error(
          `Asset count mismatch: expected ${onchainAssetList.length}, found ${activeAssets.length} active assets`
        );
      }

      // Sort and map baseline prices according to asset config
      const baselinePrices = onchainAssetList.map((asset: OnchainAssetConfig) => {
        const mappedAsset: any = activeAssets.find(
          (a: any) => a.assetAddress.toLowerCase() === asset.assetId.toString().toLowerCase()
        );
        return new BN(Math.floor(mappedAsset.price));
      });

      // Execute baskt activation on-chain
      const tx = await basktClient.activateBaskt(new PublicKey(basktId), baselinePrices);
      
      logger.info('Baskt activated successfully', { basktId, tx, txSignature: basktCreatedMessage.txSignature, uid: onchainBaskt.uid.toString() });

      // Create baskt metadata
      await this.createBasktMetadata(basktId, onchainBaskt.uid.toString(), basktCreatedMessage.txSignature);

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
    basktId: string,
    name: string,
    txSignature: string
  ): Promise<void> {
    try {
      const result = await querierClient.metadata.createBaskt({
        basktId,
        name,
        txSignature,
      });

      if (!result) {
        throw new Error('Failed to create baskt metadata');
      }

      logger.info('Baskt metadata created successfully', { basktId });
    } catch (error) {
      logger.error('Failed to create baskt metadata', {
        basktId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
