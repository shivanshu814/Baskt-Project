import { Worker } from 'bullmq';
import { rebalanceQueue, connection } from '../config/queue';
import { BasktMetadataSchema, BasktMetadataModel } from '@baskt/types';
import { connectMongoDB } from '../config/mongo';
import { PublicKey } from '@solana/web3.js';
import { basktClient } from '../config/client';
import { trpcClient } from '../config/client';
import mongoose from 'mongoose';
import { BN } from 'bn.js';

const BasktMetadataModel = mongoose.model<BasktMetadataModel>('BasktMetadata', BasktMetadataSchema);

function periodToMs(period: { value: number; unit: 'day' | 'hour' | 'minute' }) {
  switch (period.unit) {
    case 'day':
      return period.value * 24 * 60 * 60 * 1000;
    case 'hour':
      return period.value * 60 * 60 * 1000;
    case 'minute':
      return period.value * 60 * 1000;
    default:
      return period.value * 24 * 60 * 60 * 1000;
  }
}

const rebalanceWorker = new Worker(
  rebalanceQueue.name,
  async (job) => {
    console.log(`\n[${new Date().toLocaleTimeString()}] starting rebalance: ${job.data.basktId}`);
    console.log('─'.repeat(60));

    await connectMongoDB();

    const basktConfig = job.data;

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
      const getCurrentNavForBaskt = async (basktId: PublicKey) => {
        const navResult = await trpcClient.baskt.getBasktNAV.query({
          basktId: basktId.toString(),
        });

        if (!navResult.success) {
          const errorMessage =
            'error' in navResult
              ? navResult.error
              : 'message' in navResult
              ? navResult.message
              : 'Unknown error';
          console.error('Failed to fetch baskt metadata:', errorMessage);
          throw new Error('Failed to fetch baskt metadata');
        }

        if (!('data' in navResult)) {
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
