import { BasktAssetInfo } from '@baskt/types';

/**
 * Calculate the current weight of each asset in a basket based on price changes
 *
 * Current Weight for Asset i:
 * Current Weight_i = (w_i * (1 + r_i)) / (∑ w_j * (1 + r_j))
 *
 * Where:
 * w_i: Target weight of asset i (as a decimal, e.g., 0.5 for 50%)
 * r_i: Return since baseline price (positive for long, inverse for short)
 *
 * Direction is applied to return:
 * Long: r_i = (P_current - P_baseline) / P_baseline
 * Short: r_i = (P_baseline - P_current) / P_baseline
 *
 * @param assets Array of basket assets with price, baselinePrice, weight, and direction
 * @returns Array of current weights (as percentages, e.g., 54.55 for 54.55%)
 */
export function calculateCurrentWeights(assets: BasktAssetInfo[]): number[] {
  // Convert weights from percentages to decimals (e.g., 50 -> 0.5)
  const weights = assets.map((asset) => asset.weight / 100);

  // Calculate returns for each asset based on direction
  const returns = assets.map((asset) => {
    if (!asset.baselinePrice || asset.baselinePrice === 0) {
      return 0; // No baseline price or zero baseline price, return is 0
    }

    const priceDiff = asset.price - asset.baselinePrice;
    const returnValue = priceDiff / asset.baselinePrice;

    // Apply direction: positive for long, inverse for short
    return asset.direction ? returnValue : -returnValue;
  });

  // Calculate weighted returns: w_i * (1 + r_i)
  const weightedReturns = weights.map((weight, index) => weight * (1 + returns[index]));

  // Calculate sum of weighted returns: ∑ w_j * (1 + r_j)
  const sumWeightedReturns = weightedReturns.reduce((sum, value) => sum + value, 0);

  // Calculate current weights as percentages
  if (sumWeightedReturns === 0) {
    // If sum is zero, return original weights as percentages
    return assets.map((asset) => asset.weight);
  }

  return weightedReturns.map((value) => (value / sumWeightedReturns) * 100);
}
