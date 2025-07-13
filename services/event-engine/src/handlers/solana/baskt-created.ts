import { PublicKey } from '@solana/web3.js';
import { basktClient, querierClient } from '../../utils/config';
import { OnchainAssetConfig, OnchainBasktAccount } from '@baskt/types';
import { MAX_ASSET_PRICE_AGE_MS } from '@baskt/sdk';
import { BN } from 'bn.js';
import { ObserverEvent } from '../../types';
import { EventSource } from '../../types';

export interface BasktCreatedEvent {
  basktId: string;
  basktName: string;
  creator: string;
  is_public: boolean;
  asset_count: number;
  timestamp: number;
}

async function createBasktMutation(
  basktId: string,
  onchainBaskt: OnchainBasktAccount,
  basktCreatedData: BasktCreatedEvent,
) {
  try {
    const result = await querierClient.metadata.createBaskt({
      basktId: basktId,
      name: basktCreatedData.basktName,
      creator: basktCreatedData.creator,
      assets: onchainBaskt.currentAssetConfigs.map((config: OnchainAssetConfig) =>
        config.assetId.toString(),
      ),
      //TODO user submitted value. Eventually a config will be added to the event
      rebalancePeriod: {
        value: 24,
        unit: 'hour',
      },
      txSignature: 'pending',
    });

    if (!result) {
      throw new Error('Failed to create baskt metadata');
    }
  } catch (error) {
    console.error('Error storing baskt metadata:', error);
  }
}

export default {
  source: EventSource.SOLANA,
  type: 'basktCreatedEvent',
  handler: async (event: ObserverEvent) => {
    const basktEventCreatedData = event.payload.event as BasktCreatedEvent;
    const basktId = basktEventCreatedData.basktId;

    const onchainBaskt = (await basktClient.readWithRetry(
      async () => await basktClient.getBaskt(new PublicKey(basktId), 'confirmed'),
      2,
      100,
    )) as OnchainBasktAccount;

    const onchainAssetList = onchainBaskt.currentAssetConfigs;
    const assetsResult = await querierClient.asset.getAssetsByAddress(
      onchainAssetList.map((assetConfig: OnchainAssetConfig) => assetConfig.assetId.toString()),
      { withLatestPrices: true },
    );
    const currentTime = Math.floor(Date.now());

    if (!assetsResult.success || !assetsResult.data || assetsResult.data.length === 0) {
      return;
    }

    const assets = assetsResult.data;
    const activeAssets = assets.filter(
      (asset: any) =>
        asset.price > 0 &&
        Math.abs(currentTime - (asset.latestPrice?.time || 0)) < MAX_ASSET_PRICE_AGE_MS,
    );

    if (activeAssets.length !== onchainAssetList.length) {
      console.log(
        'Assets not found which are active',
        activeAssets.length,
        onchainAssetList.length,
      );
      return;
    }

    //Sort the active assets according to the asset config
    const baselinePrices = onchainAssetList.map((asset: OnchainAssetConfig) => {
      const assetMetrics: any = activeAssets.find(
        (a: any) => a.assetAddress.toLowerCase() === asset.assetId.toString().toLowerCase(),
      );
      return new BN(Math.floor(assetMetrics.priceMetrics.price));
    });

    try {
      let tx = await basktClient.activateBasktAndInitializeFundingIndex(
        new PublicKey(basktId),
        baselinePrices,
      );
      console.log('Baskt activated and funding index initialized successfully with tx:', tx);

      await createBasktMutation(basktId, onchainBaskt, basktEventCreatedData);

      return tx;
    } catch (error) {
      console.error('Error in baskt activation process:', error);
      throw error;
    }
  },
};
