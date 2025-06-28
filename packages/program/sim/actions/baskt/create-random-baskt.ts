import BN from 'bn.js';
import dotenv from 'dotenv';
import { PublicKey } from '@solana/web3.js';
import { client } from '../../client';

dotenv.config();
function randomAlphanumeric(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const createRandomBasket = async (
  args: string[],
): Promise<{
  name: string;
  basktId: PublicKey;
  assets: {
    assetId: PublicKey;
    direction: boolean;
    weight: BN;
    baselinePrice: BN;
  }[];
}> => {
  const numAssets = parseInt(args[0], 10);
  if (isNaN(numAssets) || numAssets <= 0) {
    throw new Error('Usage: create-random-basket <numAssets>');
  }

  const availableAssets = await client.getAllAssets();
  if (availableAssets.length < numAssets) {
    throw new Error('Not enough assets available to create the basket.');
  }
  // Shuffle and pick numAssets
  const shuffled = [...availableAssets].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, numAssets);

  // Assign random weights that sum to 10000
  let remaining = 10000;
  const weights: InstanceType<typeof BN>[] = [];
  for (let i = 0; i < numAssets; i++) {
    let weight;
    if (i === numAssets - 1) {
      weight = remaining;
    } else {
      // At least 1% per asset, randomize
      const max = remaining - (numAssets - i - 1);
      weight = Math.floor(Math.random() * (max - 100) + 100);
      remaining -= weight;
    }
    weights.push(new BN(weight));
  }
  // Shuffle weights to avoid bias
  for (let i = weights.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [weights[i], weights[j]] = [weights[j], weights[i]];
  }

  // Assign random directions
  const assets = selected.map((asset, idx) => ({
    assetId: asset.address,
    direction: Math.random() < 0.5, // true = long, false = short
    weight: weights[idx],
    baselinePrice: new BN(0),
  }));

  const basketName = randomAlphanumeric(12);
  const { basktId } = await client.createBaskt(basketName, assets, true);
  console.log('Basket created with ID:', basktId.toString());
  console.log(
    'Basket assets:',
    assets.map((a) => ({
      assetId: a.assetId.toString(),
      direction: a.direction,
      weight: a.weight.toString(),
    })),
  );
  return { name: basketName, basktId, assets };
};

createRandomBasket.description =
  'Creates a basket with random assets and weights. Usage: create-random-basket <numAssets>';
createRandomBasket.aliases = ['cra'];

export default createRandomBasket;
