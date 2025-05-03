import { PublicKey } from '@solana/web3.js';
import { sdkClient } from '../utils';
import { AssetMetadataModel } from '../utils/models';
import { OnchainAsset } from '@baskt/types';
const sdkClientInstance = sdkClient();
export async function getAllAssets() {
  return getAllAssetsInternal(false);
}

export async function getAllAssetsWithConfig() {
  return getAllAssetsInternal(true);
}

async function getAllAssetsInternal(config: boolean) {
  try {
    const assetConfigs = await AssetMetadataModel.find().sort({ createdAt: -1 });
    const assets = await sdkClientInstance.getAllAssets();

    if (!assets || !assetConfigs || assets.length === 0 || assetConfigs.length === 0) {
      console.error('No assets found');
      return {
        success: false,
        data: [],
      };
    }

    // Map Asset to the configs and combine then
    const combinedAssets = assetConfigs.map((assetConfig) => {
      return combineAsset(
        assets.find((asset) => asset.ticker.toString() === assetConfig.ticker.toString())!,
        assetConfig,
        config,
      );
    });
    return {
      success: true,
      data: combinedAssets,
    };
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw new Error('Failed to fetch assets');
  }
}

export async function getAssetFromAddress(assetAddress: string) {
  try {
    console.log('Fetching asset from address:', assetAddress);
    const asset = await AssetMetadataModel.findOne({ assetAddress }).exec();
    console.log(await sdkClientInstance.getAssetRaw(new PublicKey(assetAddress)));
    const onchainAsset = await sdkClientInstance.getAsset(new PublicKey(assetAddress));
    return combineAsset(onchainAsset, asset, false);
  } catch (error) {
    console.error('Error fetching asset:', error);
    return null;
  }
}

export function combineAsset(
  onchainAsset: OnchainAsset,
  config: any,
  shouldPassConfig: boolean = false,
) {
  console.log(onchainAsset, config, shouldPassConfig);
  const price = config.priceMetrics?.price ?? 0;
  const change24h = config.priceMetrics?.change24h ?? 0;

  return {
    ticker: onchainAsset.ticker,
    assetAddress: onchainAsset.address.toString(),
    logo: config.logo,
    name: config.name,
    price,
    change24h,
    account: onchainAsset,
    weightage: 0,
    config: shouldPassConfig ? config.priceConfig : undefined,
  };
}
