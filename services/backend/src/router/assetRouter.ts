import { sdkClient } from '../utils';
import { AssetMetadataModel } from '../utils/models';

export async function getAllAssetsWithConfig() {
  return getCombinedAsset(true);
}

export async function getAllAssets() {
  return getCombinedAsset(false);
}

async function getCombinedAsset(config: boolean) {
  try {
    const assetConfigs = await AssetMetadataModel.find().sort({ createdAt: -1 });
    const sdkClientInstance = sdkClient();
    const assets = await sdkClientInstance.getAllAssets();

    if (!assets || !assetConfigs || assets.length === 0 || assetConfigs.length === 0) {
      console.error('No assets found');
      return {
        success: false,
        data: [],
      };
    }

    // TODO do this.
    const price = 10;
    const change24h = 10;

    // Map Asset to the configs and combine then
    const combinedAssets = assetConfigs.map((assetConfig) => {
      return {
        ticker: assetConfig.ticker,
        assetAddress: assetConfig.assetAddress,
        logo: assetConfig.logo,
        name: assetConfig.name,
        price,
        change24h,
        account: assets.find((asset) => asset.ticker.toString() === assetConfig.ticker.toString())!,
        config: config ? assetConfig.priceConfig : undefined,
      };
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
