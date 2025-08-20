import { EventSource, ObserverEvent } from '../../types';
import { BasktRebalancedEvent, OnchainBasktAccount } from '@baskt/types';
import { basktClient, querierClient } from '../../utils/config';
import { FeeEvents } from '@baskt/querier';
import { BN } from 'bn.js';



async function basktRebalancedHandler(event: ObserverEvent) {
  const basktRebalancedData = event.payload.event as BasktRebalancedEvent;
  const tx = event.payload.signature;

  try {
    // Get the baskt metadata to access current state (this is the PREVIOUS state before rebalance)
    const baskt = await querierClient.metadata.findBasktById(basktRebalancedData.basktId.toString());
    
    if (!baskt) {
      console.error('Baskt not found for rebalance event:', basktRebalancedData.basktId.toString());
      return;
    }

    const basktAccount = await basktClient.readWithRetry(
      async () => await basktClient.getBasktAccount(basktRebalancedData.basktId, 'confirmed'),
      3,
      1500
    ) as OnchainBasktAccount; 

    // The currentAssetConfigs in baskt metadata represents the PREVIOUS state before rebalance
    // The rebalance event contains the NEW state after rebalance
    const previousBaselineNav = baskt.baselineNav;
    const previousRebalanceIndex = baskt.rebalanceFeeIndex?.cumulativeIndex ? parseInt(baskt.rebalanceFeeIndex.cumulativeIndex) : 0;
    
    const previousAssetConfigs = baskt.currentAssetConfigs.map((config: any) => ({
      assetId: config.assetId,
      weight: config.weight.toString(),
      direction: config.direction,
      baselinePrice: config.baselinePrice,
    }));

    // Calculate NAV change
    const navChange = basktRebalancedData.baselineNav.sub(new BN(previousBaselineNav));
    const navChangePercentage = parseFloat(navChange.mul(new BN(10000)).div(new BN(previousBaselineNav)).toString()) / 100;

    // Create rebalance history record
    await querierClient.baskt.createRebalanceHistory({
      baskt: baskt._id,
      basktId: basktRebalancedData.basktId.toString(),
      txSignature: tx,
      
      // Previous state (from current baskt metadata)
      previousBaselineNav,
      previousRebalanceIndex,
      previousAssetConfigs,
      
      // New state (from rebalance event)
      newBaselineNav: basktRebalancedData.baselineNav.toString(),
      newRebalanceIndex: basktRebalancedData.rebalanceIndex.toNumber(),
      newAssetConfigs: basktAccount.currentAssetConfigs.map((config: any) => ({
        assetId: config.assetId,
        weight: config.weight.toString(),
        direction: config.direction,
        baselinePrice: config.baselinePrice,
      })),
      
      // Performance metrics
      navChange: navChange.toString(),
      navChangePercentage,
    });

    await querierClient.baskt.resyncBasktMetadata(basktRebalancedData.basktId.toString());


  } catch (error) {
    console.error('Error processing baskt rebalanced event:', error);
  }
}

export default {
  type: 'basktRebalancedEvent',
  handler: basktRebalancedHandler,
  source: EventSource.SOLANA,
};
