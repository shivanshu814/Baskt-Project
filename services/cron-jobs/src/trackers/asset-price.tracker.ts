import { BaseJob } from '../job';
import { querierClient } from '../config/client';
import { AssetPrice } from '@baskt/querier';


const PRICE_UPDATE_FREQUENCY_SECONDS = parseInt(process.env.PRICE_UPDATE_FREQUENCY_SECONDS || '300');

export class AssetPriceTracker extends BaseJob {
  constructor() {
    super('asset-price-tracker', PRICE_UPDATE_FREQUENCY_SECONDS);
  }

  async run(): Promise<void> {

    // fetch all asset prices from the database
    const assets = await querierClient.asset.getAllAssets();

    for (const asset of assets.data || []) {
      await AssetPrice.create({
        asset_id: asset.ticker,
        price: asset.price,
        time: new Date(),
      });
    }
  }
}