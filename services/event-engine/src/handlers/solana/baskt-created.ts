import { PublicKey } from '@solana/web3.js';
import { basktClient, querierClient } from '../../utils/config';
import { OnchainAssetConfig, OnchainBasktAccount } from '@baskt/types';
import { BN } from 'bn.js';
import { ObserverEvent } from '../../types';
import { EventSource } from '../../types';
import { CombinedAsset } from '@baskt/querier';

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
      name: basktCreatedData.uid.toString(),
      creator: basktCreatedData.creator,
      assets: onchainBaskt.currentAssetConfigs.map((config: OnchainAssetConfig) =>
        config.assetId.toString(),
      ),
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
      async () => await basktClient.getBasktRaw(new PublicKey(basktId), 'confirmed'),
      2,
      100,
    )) as OnchainBasktAccount;

    const onchainAssetList = onchainBaskt.currentAssetConfigs;
    const assetsResult = await querierClient.asset.getAssetsByAddress(
      onchainAssetList.map((assetConfig: OnchainAssetConfig) => assetConfig.assetId.toString()),
      {},
    );

    if (!assetsResult.success || !assetsResult.data || assetsResult.data.length === 0) {
      console.log('No assets found');
      return;
    }

    const assets = assetsResult.data;
    const activeAssets = assets.filter(
      (asset: CombinedAsset) =>
        asset.price > 0 && asset.account?.isActive,
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
      const mappedAsset: any = activeAssets.find(
        (a: any) => a.assetAddress.toLowerCase() === asset.assetId.toString().toLowerCase(),
      );
      return new BN(Math.floor(mappedAsset.price));
    });

    try {
      let tx = await basktClient.activateBaskt(new PublicKey(basktId), baselinePrices);
      console.log('Baskt activated successfully with tx:', tx);
      await createBasktMutation(basktId, onchainBaskt, basktEventCreatedData);
      return tx;
    } catch (error) {
      console.error('Error in baskt activation process:', error);
      throw error;
    }
  },
};
