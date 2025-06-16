import { PublicKey } from '@solana/web3.js';
import { basktClient } from '../utils/config';
import { OnchainAssetConfig, OnchainBasktAccount } from '@baskt/types';
import { trpcClient } from '../utils/config';
import { MAX_ASSET_PRICE_AGE_MS } from '@baskt/sdk/dist';
import { BN } from 'bn.js';

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
    const result = await trpcClient.baskt.createBasktMetadata.mutate({
      basktId: basktId,
      name: basktCreatedData.basktName,
      creator: basktCreatedData.creator,
      assets: onchainBaskt.currentAssetConfigs.map((config: OnchainAssetConfig) =>
        config.assetId.toString(),
      ),
      rebalancePeriod: {
        value: 24,
        unit: 'hour',
      },
      txSignature: 'pending',
    });

    if (!result.success) {
      throw new Error('Failed to create baskt metadata');
    }
  } catch (error) {
    console.error('Error storing baskt metadata:', error);
  }
}

export default async function basktCreatedHandler(data: any) {
  const basktEventCreatedData = data as BasktCreatedEvent;
  const basktId = basktEventCreatedData.basktId;

  const onchainBaskt = (await basktClient.readWithRetry(
    async () => await basktClient.getBaskt(new PublicKey(basktId), 'confirmed'),
    2,
    100,
  )) as OnchainBasktAccount;
  const onchainAssetList = onchainBaskt.currentAssetConfigs;

  const assets = await trpcClient.asset.getAssetsByAddress.query(
    onchainAssetList.map((assetConfig: OnchainAssetConfig) => assetConfig.assetId.toString()),
  );

  if (!assets || assets.length === 0) {
    return;
  }

  const currentTime = Math.floor(Date.now());

  const activeAssets = assets.filter(
    (asset: any) =>
      asset.priceMetrics?.price > 0 &&
      asset.priceMetrics?.timestamp + MAX_ASSET_PRICE_AGE_MS > currentTime,
  );

  if (activeAssets.length !== onchainAssetList.length) {
    return;
  }

  // Make the assets in that order

  const randomBaselinePrices = activeAssets.map(
    (asset: any) => new BN(Math.floor(asset.priceMetrics.price)),
  );

  try {
    let tx = await basktClient.activateBaskt(new PublicKey(basktId), randomBaselinePrices);
    console.log('Baskt activated successfully with tx:', tx);

    await createBasktMutation(basktId, onchainBaskt, basktEventCreatedData);

    console.log('Initializing funding index...');
    tx = await basktClient.initializeFundingIndex(new PublicKey(basktId));
    console.log('Funding index initialized successfully with tx:', tx);
    return tx;
  } catch (error) {
    console.error('Error in baskt activation process:', error);
    throw error;
  }
}
