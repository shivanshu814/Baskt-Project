import { PublicKey } from '@solana/web3.js';
import { basktClient } from '../utils/config';
import { BN } from 'bn.js';
import { OnchainAssetConfig } from '@baskt/types';
import { trpcClient } from '../utils/config';

export interface BasktCreatedEvent {
  basktId: string;
  basktName: string;
  creator: string;
  is_public: boolean;
  asset_count: number;
  timestamp: number;
}

export default async function basktCreatedHandler(data: any) {
  const basktEventCreatedData = data as BasktCreatedEvent;
  const basktId = basktEventCreatedData.basktId;

  const onchainBaskt = await basktClient.readWithRetry(
    async () => await basktClient.getBaskt(new PublicKey(basktId), 'confirmed'),
    2,
    100,
  );

  //TODO We should for each of these
  // assets fetch their current price and put that as the baseline price
  const randomBaselinePrices = onchainBaskt.currentAssetConfigs.map(
    () => new BN(Math.floor(Math.random() * 1000) * 1e6),
  );

  try {
    const result = await trpcClient.baskt.createBasktMetadata.mutate({
      basktId: basktId,
      name: basktEventCreatedData.basktName,
      creator: basktEventCreatedData.creator,
      assets: onchainBaskt.currentAssetConfigs.map((config: OnchainAssetConfig) =>
        config.assetId.toString(),
      ),
      image: `https://api.dicebear.com/7.x/shapes/svg?seed=${basktEventCreatedData.basktName}&backgroundColor=4F46E5&shape1Color=6366F1&shape2Color=818CF8`,
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

  try {
    let tx = await basktClient.activateBaskt(new PublicKey(basktId), randomBaselinePrices);
    console.log('Baskt activated successfully with tx:', tx);

    await trpcClient.baskt.createBasktMetadata.mutate({
      basktId: basktId,
      name: basktEventCreatedData.basktName,
      creator: basktEventCreatedData.creator,
      assets: onchainBaskt.currentAssetConfigs.map((config: OnchainAssetConfig) =>
        config.assetId.toString(),
      ),
      image: `https://api.dicebear.com/7.x/shapes/svg?seed=${basktEventCreatedData.basktName}&backgroundColor=4F46E5&shape1Color=6366F1&shape2Color=818CF8`,
      rebalancePeriod: {
        value: 24,
        unit: 'hour',
      },
      txSignature: tx,
    });

    console.log('Initializing funding index...');
    tx = await basktClient.initializeFundingIndex(new PublicKey(basktId));
    console.log('Funding index initialized successfully with tx:', tx);
    return tx;
  } catch (error) {
    console.error('Error in baskt activation process:', error);
    throw error;
  }
}
