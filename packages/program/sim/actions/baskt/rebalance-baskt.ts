import { BN } from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';
import { calculateNav } from '@baskt/sdk';

// Will only do a random price movement for now 
const rebalanceBaskt = async (args: string[]) => {
  try {
    if (args.length < 2) {
      throw new Error('Usage: rebalance-baskt <basktId> <rebalanceFeePerUnit>');
    }

    const basktId = new PublicKey(args[0]);
    const rebalanceFeePerUnit = new BN(args[1]);


    const baskt = await client.getBaskt(basktId);
    const baselineNav = new BN(baskt.baselineNav);
   
    const randomPriceBetween = Math.random() * 10 * 1e6 + 95*1e6;

    const assetConfigs = baskt.currentAssetConfigs.map((config) => ({
      assetId: config.assetId,
      direction: config.direction,
      weight: config.weight,
      baselinePrice: config.baselinePrice.mul(new BN(randomPriceBetween)).div(new BN(100 * 1e6)), // Up to +-5% random price movement
    }));

    const newNav = calculateNav(baskt.currentAssetConfigs, assetConfigs, baselineNav);

    console.log('Rebalancing baskt:', basktId.toString());
    console.log('Baseline asset configs:', baskt.currentAssetConfigs.map((config) => ({
      assetId: config.assetId.toString(),
      direction: config.direction,
      weight: config.weight.toString(),
      baselinePrice: config.baselinePrice.toString(),
    })));
    console.log('Asset configs:', assetConfigs.map((config) => ({
      assetId: config.assetId.toString(),
      direction: config.direction,
      weight: config.weight.toString(),
      baselinePrice: config.baselinePrice.toString(),
    })));
    console.log('Baseline NAV:', baselineNav.toString());
    console.log('New NAV:', newNav.toString());
    console.log('Rebalance fee per unit:', rebalanceFeePerUnit.toString());

    const rebalanceTx = await client.rebalanceBaskt(basktId, assetConfigs, newNav, rebalanceFeePerUnit);
    console.log('Baskt rebalanced successfully! Transaction:', rebalanceTx);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

rebalanceBaskt.description = 'Rebalances a baskt with new asset weights. Usage: rebalance-baskt <basktId> <assetId1> <weight1> [assetId2] [weight2] ...';
rebalanceBaskt.aliases = ['rb'];

export default rebalanceBaskt; 