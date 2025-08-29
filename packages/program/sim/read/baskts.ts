import { client } from '../client';

const readBaskts = async () => {
  try {
    const baskts = await client.getAllBaskts();
    
    if (baskts.length === 0) {
      console.log('No baskts found');
      return;
    }

    console.log(`Found ${baskts.length} baskts:\n`);
    
    baskts.forEach((baskt, index) => {
      console.log(`Baskt ${index + 1}:`);
      console.log(`  ID: ${baskt.basktId.toString()}`);
      console.log(`  Address: ${baskt.address.toString()}`);
      console.log(`  Name: ${baskt.name || 'N/A'}`);
      console.log(`  Is Public: ${baskt.isPublic}`);
      console.log(`  Is Trading: ${baskt.isTradingOrUnwinding}`);
      console.log(`  Open Positions: ${baskt.openPositions}`);
      console.log(`  Rebalance Fee Index: ${baskt.rebalanceFeeIndex?.cumulativeIndex.toString() || 'N/A'}`);
      console.log(`  Funding Index: ${baskt.fundingIndex?.cumulativeIndex.toString() || 'N/A'}`);
      
      if (baskt.assets && baskt.assets.length > 0) {
        console.log(`  Assets (${baskt.assets.length}):`);
        baskt.assets.forEach((asset, assetIndex) => {
          console.log(`    ${assetIndex + 1}. Asset ID: ${asset.assetId.toString()}`);
          console.log(`       Weight: ${asset.weight.toString()}`);
          console.log(`       Direction: ${asset.direction ? 'Long' : 'Short'}`);
        });
      }
      console.log('');
    });
  } catch (error) {
    console.error('Error reading baskts:', error);
  }
};

readBaskts.description = 'Lists all available baskts';
readBaskts.aliases = ['baskts', 'listbaskts'];

export default readBaskts;