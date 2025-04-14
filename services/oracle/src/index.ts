import mongoose from 'mongoose';
import { OracleConfigSchema, OracleConfig } from '@baskt/types';
import { connectDB, disconnectDB } from './config/db';
import { fetchAssetPrices } from './pricing';

// Read the current OracleConfig Mongoose

// Then fetch the current price of the asset from the provider

// Store the price in a new Price Mongoose

async function main() {
  await connectDB();

  const OracleConfigModel = mongoose.model('OracleConfig', OracleConfigSchema);

  const oracleConfigs = await OracleConfigModel.find({});

  console.log(oracleConfigs.map((config: OracleConfig) => config.priceConfig));

  const prices = await fetchAssetPrices(
    oracleConfigs.map((config: OracleConfig) => config.priceConfig),
  );

  console.log(prices);
}

main()
  .then(() => {
    console.log('Oracle service done');
  })
  .catch((error) => {
    console.error('Error in main function:', error);
  })
  .finally(() => {
    disconnectDB();
  });
