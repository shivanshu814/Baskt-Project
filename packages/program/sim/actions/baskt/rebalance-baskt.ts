import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';

const rebalanceBaskt = async (args: string[]) => {
  try {
    if (args.length < 3) {
      throw new Error('Usage: rebalance-baskt <basktId> <assetId1> <weight1> [assetId2] [weight2] ...');
    }

    const basktId = new PublicKey(args[0]);
    const assetConfigs = [];

    // Parse asset configurations from arguments
    for (let i = 1; i < args.length; i += 2) {
      if (i + 1 >= args.length) {
        throw new Error('Invalid number of arguments. Each asset needs both ID and weight.');
      }

      const assetId = new PublicKey(args[i]);
      const weight = parseInt(args[i + 1]);
      
      if (isNaN(weight) || weight < 0) {
        throw new Error(`Invalid weight for asset ${assetId.toString()}: ${args[i + 1]}`);
      }

      assetConfigs.push({
        assetId,
        weight: new BN(weight),
        direction: true, // Default to long, can be made configurable if needed
        baselinePrice: new BN(0), // Required by OnchainAssetConfig interface
      });
    }

    console.log('Rebalancing baskt:', basktId.toString());
    console.log('Asset configurations:', assetConfigs.map(config => ({
      assetId: config.assetId.toString(),
      weight: config.weight.toString(),
      direction: config.direction,
      baselinePrice: config.baselinePrice.toString(),
    })));

    const rebalanceTx = await client.rebalanceBaskt(basktId, assetConfigs);
    console.log('Baskt rebalanced successfully! Transaction:', rebalanceTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

rebalanceBaskt.description = 'Rebalances a baskt with new asset weights. Usage: rebalance-baskt <basktId> <assetId1> <weight1> [assetId2] [weight2] ...';
rebalanceBaskt.aliases = ['rb'];

export default rebalanceBaskt; 