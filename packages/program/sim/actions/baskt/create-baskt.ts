import BN from 'bn.js';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';

const createBaskt = async (args: string[]) => {
  try {
    if (args.length < 4) {
      throw new Error('Usage: create-baskt <basktName> <isPublic> <assetId1> <weight1> <direction1> [assetId2] [weight2] [direction2] ...');
    }

    const basktName = args[0];
    const isPublic = args[1] === 'true';
    const assetConfigs = [];

    // Parse asset configurations from arguments
    for (let i = 2; i < args.length; i += 3) {
      if (i + 2 >= args.length) {
        throw new Error('Invalid number of arguments. Each asset needs ID, weight, and direction.');
      }

      const assetId = new PublicKey(args[i]);
      const weight = parseInt(args[i + 1]);
      const direction = args[i + 2] === 'true';
      
      if (isNaN(weight) || weight < 0) {
        throw new Error(`Invalid weight for asset ${assetId.toString()}: ${args[i + 1]}`);
      }

      assetConfigs.push({
        assetId,
        weight: new BN(weight),
        direction,
        baselinePrice: new BN(0), // Required by OnchainAssetConfig interface
      });
    }

    console.log('Creating baskt with name:', basktName);
    console.log('Is public:', isPublic);
    console.log('Asset configurations:', assetConfigs.map(config => ({
      assetId: config.assetId.toString(),
      weight: config.weight.toString(),
      direction: config.direction,
      baselinePrice: config.baselinePrice.toString(),
    })));

    const { basktId, txSignature } = await client.createBaskt( assetConfigs, isPublic);
    console.log('Baskt created successfully!');
    console.log('Baskt ID:', basktId.toString());
    console.log('Transaction:', txSignature);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

createBaskt.description = 'Creates a baskt with specified assets and weights. Usage: create-baskt <basktName> <isPublic> <assetId1> <weight1> <direction1> [assetId2] [weight2] [direction2] ...';
createBaskt.aliases = ['cb'];

export default createBaskt; 