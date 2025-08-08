import BN from 'bn.js';
import { PRICE_PRECISION } from './nav';

export const LIQUIDATION_PRECISION = new BN(10 ** 4); // 10,000 for basis points

/**
 * Calculates the liquidation price for a position based on the liquidation condition:
 * total_equity < min_collateral_required
 * 
 * Where:
 * - total_equity = collateral + unrealized_pnl + funding_accumulated
 * - min_collateral_required = (size * current_price * liquidation_threshold_bps) / 10000
 * - unrealized_pnl = (current_price - entry_price) * size * direction
 * 
 * At liquidation point, these are equal, so we solve for current_price (liquidation_price)
 *
 * @param entryPrice - The price at which the position was entered (in price precision, e.g., 1e6 for $1)
 * @param collateral - The amount of collateral posted (in USDC, e.g., 1e6 for $1)
 * @param size - The position size (in contracts, already scaled)
 * @param liquidationThresholdBps - The liquidation threshold in basis points (e.g., 500 for 5%)
 * @param isLong - true for long positions, false for short positions
 * @param fundingAccumulated - Accumulated funding payments (default: 0)
 * @returns The liquidation price (in same precision as entryPrice)
 */
export function calculateLiquidationPriceInternal(
    entryPrice: BN,
    collateral: BN,
    size: BN,
    liquidationThresholdBps: BN,
    isLong: boolean,
    fundingAccumulated: BN = new BN(0)
  ): BN {
    if (isLong) {
      // LONG: numerator = collateral - entry_price * size + funding
      // denominator = size * (ltFraction - 1) = size * (liquidationThresholdBps - 10000) / 10000
      
      const numerator = collateral
        .sub(entryPrice.mul(size).div(PRICE_PRECISION))
        .add(fundingAccumulated);
      
      const denominator = size
        .mul(liquidationThresholdBps.sub(LIQUIDATION_PRECISION))
        .div(LIQUIDATION_PRECISION);
      
      return numerator.div(denominator).mul(PRICE_PRECISION);
    } else {
      // SHORT: numerator = collateral + entry_price * size + funding  
      // denominator = size * (ltFraction + 1) = size * (liquidationThresholdBps + 10000) / 10000
      
      const numerator = collateral
        .add(entryPrice.mul(size).div(PRICE_PRECISION))  // Need to scale properly
        .add(fundingAccumulated);
      
      const denominator = size
        .mul(liquidationThresholdBps.add(LIQUIDATION_PRECISION))
        .div(LIQUIDATION_PRECISION);
      
      return numerator.div(denominator).mul(PRICE_PRECISION);
    }
  }

/**
 * Calculates the maximum loss a position can sustain before liquidation
 *
 * @param collateral - The amount of collateral posted
 * @param size - The position size
 * @param currentPrice - The current market price
 * @param liquidationThresholdBps - The liquidation threshold in basis points
 * @param fundingAccumulated - Accumulated funding payments (default: 0)
 * @returns The maximum loss before liquidation
 */
export function calculateMaxLossBeforeLiquidation(
  collateral: BN,
  size: BN,
  currentPrice: BN,
  liquidationThresholdBps: BN,
  fundingAccumulated: BN = new BN(0)
): BN {
    const maintenanceMargin = size
      .mul(currentPrice)
      .mul(liquidationThresholdBps)
      .div(LIQUIDATION_PRECISION);
    
    return collateral.add(fundingAccumulated).sub(maintenanceMargin);
}

/**
 * Checks if a position is liquidatable at the current price
 *
 * @param entryPrice - The entry price of the position
 * @param currentPrice - The current market price
 * @param collateral - The amount of collateral posted
 * @param size - The position size
 * @param liquidationThresholdBps - The liquidation threshold in basis points
 * @param isLong - true for long positions, false for short positions
 * @param fundingAccumulated - Accumulated funding payments (default: 0)
 * @returns true if the position is liquidatable
 */
export function isPositionLiquidatable(
  entryPrice: BN,
  currentPrice: BN,
  collateral: BN,
  size: BN,
  liquidationThresholdBps: BN,
  isLong: boolean,
  fundingAccumulated: BN = new BN(0)
): boolean {
    // Calculate unrealized PnL
    const priceDelta = isLong 
      ? currentPrice.sub(entryPrice)
      : entryPrice.sub(currentPrice);
    
    const unrealizedPnl = priceDelta.mul(size);
    
    // Calculate total equity
    const totalEquity = collateral.add(unrealizedPnl).add(fundingAccumulated);
    
    // Calculate minimum required collateral
    const minCollateral = size
      .mul(currentPrice)
      .mul(liquidationThresholdBps)
      .div(LIQUIDATION_PRECISION);
    
    return totalEquity.lt(minCollateral);
}