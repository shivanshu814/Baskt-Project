import { Worker } from 'bullmq';
import { rebalanceQueue, connection } from '../config/queue';
import { BasktMetadataSchema, BasktMetadataModel } from '@baskt/types';
import { connectMongoDB, disconnectMongoDB } from '../config/mongo';
import { PublicKey } from '@solana/web3.js';
import { basktClient, querierClient } from '../config/client';
import mongoose from 'mongoose';
import BN from 'bn.js';
import { fetchAssetPrices } from '@baskt/sdk';
import { AssetMetadataSchema as AssetMetadataSchemaType } from '@baskt/types';

/**
 * Rebalancing Worker with Deviation Threshold Check
 *
 * This worker now includes a deviation threshold check before performing automatic rebalancing.
 * The system calculates the total weighted deviation from baseline prices for all assets in a baskt.
 * If the deviation is below the threshold (default 2%), rebalancing is skipped to avoid unnecessary transactions.
 *
 * Environment Variables:
 * - REBALANCE_DEVIATION_THRESHOLD: Percentage threshold for triggering rebalancing (default: 2.0)
 *
 * The deviation calculation:
 * 1. Fetches current prices for all assets in the baskt
 * 2. Calculates percentage deviation from baseline prices
 * 3. Weights the deviation by each asset's weight in the baskt
 * 4. Returns the average weighted deviation across all assets
 */

const BasktMetadataModel = mongoose.model<BasktMetadataModel>('BasktMetadata', BasktMetadataSchema);
const AssetMetadataModel = mongoose.model('AssetMetadata', AssetMetadataSchemaType);

/**
 * Calculate the total deviation from baseline prices for all assets in a baskt
 * @param basktAssets Array of asset configurations with baseline prices
 * @param currentPrices Array of current asset prices
 * @returns Total deviation as a percentage
 */
async function calculateTotalDeviation(
  basktAssets: Array<{
    assetId: string;
    weight: BN;
    direction: boolean;
    baselinePrice: BN;
  }>,
): Promise<number> {
  try {
    // Get asset metadata for price configuration
    const assetMetadata = await AssetMetadataModel.find({
      assetAddress: { $in: basktAssets.map((asset) => asset.assetId.toString()) },
    });

    // Create price configs for fetching current prices
    const priceConfigs = basktAssets.map((asset) => {
      const metadata = assetMetadata.find((m) => m.assetAddress === asset.assetId.toString());
      if (!metadata) {
        throw new Error(`Asset metadata not found for ${asset.assetId.toString()}`);
      }

      // Extract only the required fields for AssetPriceProviderConfig
      return {
        provider: {
          id: metadata.priceConfig.provider.id,
          chain: metadata.priceConfig.provider.chain || '',
          name: metadata.priceConfig.provider.name,
        },
        twp: {
          seconds: metadata.priceConfig.twp.seconds,
        },
        updateFrequencySeconds: metadata.priceConfig.updateFrequencySeconds,
        units: metadata.priceConfig.units || 1,
      };
    });

    // Fetch current prices
    const currentPrices = await fetchAssetPrices(
      priceConfigs,
      basktAssets.map((asset) => asset.assetId.toString()),
    );

    // Calculate weighted deviation for each asset
    let totalWeightedDeviation = 0;
    let totalWeight = 0;

    for (let i = 0; i < basktAssets.length; i++) {
      const asset = basktAssets[i];
      const currentPrice = currentPrices[i];

      if (!currentPrice) {
        console.warn(`No current price available for asset ${asset.assetId}`);
        continue;
      }

      const baselinePrice = asset.baselinePrice.toNumber();
      const currentPriceValue = parseFloat(currentPrice.priceUSD);

      if (baselinePrice === 0) {
        console.warn(`Baseline price is zero for asset ${asset.assetId}`);
        continue;
      }

      // Calculate percentage deviation
      const deviation = (Math.abs(currentPriceValue - baselinePrice) / baselinePrice) * 100;

      // Apply direction: for shorts, we invert the deviation calculation
      const adjustedDeviation = asset.direction ? deviation : deviation;

      // Weight the deviation by the asset's weight
      const weight = asset.weight.toNumber() / 10000; // Convert from BPS to decimal
      const weightedDeviation = adjustedDeviation * weight;

      totalWeightedDeviation += weightedDeviation;
      totalWeight += weight;
    }

    // Return average weighted deviation
    return totalWeight > 0 ? totalWeightedDeviation / totalWeight : 0;
  } catch (error) {
    console.error('Error calculating total deviation:', error);
    return 0;
  }
}

const rebalanceWorker = new Worker(
  rebalanceQueue.name,
  async (job) => {
    console.log(`\n[${new Date().toLocaleTimeString()}] starting rebalance: ${job.data.basktId}`);
    console.log('─'.repeat(60));

    // Initialize querier and MongoDB
    await querierClient.init();
    await connectMongoDB();

    const basktConfig = job.data;
    const deviationThreshold = process.env.REBALANCE_DEVIATION_THRESHOLD
      ? parseFloat(process.env.REBALANCE_DEVIATION_THRESHOLD)
      : 2.0; // Default 2%

    try {
      let baskt;
      try {
        baskt = await basktClient.readWithRetry(
          async () => await basktClient.getBaskt(new PublicKey(basktConfig.basktId), 'confirmed'),
          2,
          100,
        );
      } catch (error) {
        console.log(`Basket ${basktConfig.basktId} not found on blockchain, skipping...`);
        return;
      }

      if (!baskt) {
        console.log(`Basket ${basktConfig.basktId} not found on blockchain, skipping...`);
        return;
      }

      const currentConfigs = baskt.currentAssetConfigs.map((config: any) => ({
        assetId: Array.isArray(config.assetId) ? config.assetId[0] : config.assetId,
        weight: config.weight,
        direction: config.direction,
        baselinePrice: config.baselinePrice,
      }));

      // Calculate total deviation from baseline prices
      console.log(`🔍 Checking deviation threshold (${deviationThreshold}%)...`);
      const totalDeviation = await calculateTotalDeviation(currentConfigs);
      console.log(`📊 Total deviation: ${totalDeviation.toFixed(2)}%`);

      // Check if deviation exceeds threshold
      if (totalDeviation < deviationThreshold) {
        console.log(
          `⏭️  Deviation (${totalDeviation.toFixed(
            2,
          )}%) below threshold (${deviationThreshold}%), skipping rebalance`,
        );
        console.log('─'.repeat(60));
        return;
      }

      console.log(
        `✅ Deviation (${totalDeviation.toFixed(
          2,
        )}%) exceeds threshold (${deviationThreshold}%), proceeding with rebalance`,
      );

      const getCurrentNavForBaskt = async (basktId: PublicKey) => {
        const navResult = await querierClient.baskt.getBasktNAV(basktId.toString());

        if (!navResult.success) {
          const errorMessage = navResult.error || navResult.message || 'Unknown error';
          console.error('Failed to fetch baskt metadata:', errorMessage);
          throw new Error('Failed to fetch baskt metadata');
        }

        if (!navResult.data) {
          console.error('Baskt metadata not found for baskt:', basktId.toString());
          throw new Error('Baskt metadata not found');
        }

        const nav = navResult.data.nav === 0 ? 1000000 : navResult.data.nav;
        return new BN(nav);
      };
      const price = await getCurrentNavForBaskt(new PublicKey(basktConfig.basktId));

      await basktClient.updateOraclePrice(new PublicKey(basktConfig.basktId), price);

      const txSignature = await basktClient.rebalanceBaskt(
        new PublicKey(basktConfig.basktId),
        currentConfigs,
      );

      const updatedBaskt = await basktClient.getBaskt(
        new PublicKey(basktConfig.basktId),
        'confirmed',
      );

      let rebalanceHistory = null;
      try {
        const rebalanceIndex = baskt.lastRebalanceIndex.toNumber();
        await new Promise((resolve) => setTimeout(resolve, 3000));

        rebalanceHistory = await basktClient.getRebalanceHistory(
          new PublicKey(basktConfig.basktId),
          rebalanceIndex,
          'confirmed',
        );
      } catch (err) {
        console.log(`Could not fetch rebalance history for ${basktConfig.basktId}`);
      }

      const now = Date.now();
      try {
        await BasktMetadataModel.updateOne(
          { basktId: basktConfig.basktId },
          {
            $set: {
              lastRebalanceTime: now,
              rebalanceHistory: {
                txSignature,
                rebalanceIndex: updatedBaskt.lastRebalanceIndex.toNumber(),
                timestamp: now,
                history: rebalanceHistory,
              },
            },
          },
        );
      } catch (err) {
        console.log(`Could not update basket metadata for ${basktConfig.basktId}`);
      }

      await disconnectMongoDB();
      await querierClient.shutdown();

      console.log(
        `✅ SUCCESSFULLY REBALANCED: ${
          basktConfig.basktId
        } (Index: ${baskt.lastRebalanceIndex.toNumber()} → ${updatedBaskt.lastRebalanceIndex.toNumber()})`,
      );
      console.log(`✅ Transaction: ${txSignature}`);
      console.log(`✅ Rebalance completed at: ${new Date().toLocaleTimeString()}`);
      console.log('─'.repeat(60));
    } catch (error) {
      console.error(`Error rebalancing basket ${basktConfig.basktId}:`, error);
      throw error;
    }
  },
  {
    concurrency: 1,
    connection,
  },
);

console.log('Rebalance worker started, waiting for jobs...');
