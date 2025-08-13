import BN from 'bn.js';
import { BPS_DIVISOR, PRICE_PRECISION } from './const';          // e.g., 10_000


/**
 * Solve for liquidation price including optional closing fee (bps of current notional).
 *
 * Liquidation condition at liq:
 *   equity = collateral + funding + PnL(liq) 
 *   PnL(liq) = (liq - entry) * size * dir / PRICE_PRECISION
 *   maint + closeFee = size * liq * (lt_bps + fee_bps) / 10_000 / PRICE_PRECISION
 *
 * => collateral + funding + (liq - entry)*size*dir/PP
 *    = liq*size*(lt_bps + fee_bps)/BPS/PP
 *
 * Solve for liq:
 *   liq * size * (dir - (lt_bps+fee_bps)/BPS) / PP = entry*size*dir/PP - collateral - funding
 *   liq = (entry*size*dir/PP - collateral - funding) / (size*(dir - (lt_bps+fee_bps)/BPS)/PP)
 *   liq = (entry*size*dir - (collateral+funding)*PP) / (size*(dir*BPS - (lt_bps+fee_bps))) * BPS
 */
export function calculateLiquidationPriceInternal(
  entryPrice: BN,                // in PRICE_PRECISION
  collateral: BN,                // in USDC precision
  size: BN,                      // scaled contracts
  liquidationThresholdBps: BN,   // bps, e.g., 500
  isLong: boolean,
  fundingAccumulated: BN = new BN(0), // in USDC precision
  totalFeeBps: BN = new BN(0)         // closing fee bps on current notional; 0 if none
): BN {
  const dir = isLong ? new BN(1) : new BN(-1);
  const bps = BPS_DIVISOR; // 10_000

  // numerator = entry*size*dir - (collateral+funding)*PP
  const entryTimesSize = entryPrice.mul(size);              // (PP * size)
  const equityFixed = collateral.add(fundingAccumulated);   // USDC
  const numerator = entryTimesSize.mul(dir).sub(equityFixed.mul(PRICE_PRECISION)); // PP*size*dir - USDC*PP

  // denom = size * (dir*BPS - (lt_bps + fee_bps))
  const ltPlusFee = liquidationThresholdBps.add(totalFeeBps);   // bps
  const denom = size.mul(dir.mul(bps).sub(ltPlusFee));          // size * (dir*BPS - (lt+fee))

  // liq = (numerator / denom) * BPS
  // Keep precision: (numerator * BPS) / denom
  // Result should be in PRICE_PRECISION
  if (denom.isZero()) throw new Error('Invalid parameters: denominator is zero');
  const liq = numerator.mul(bps).div(denom); // still in PRICE_PRECISION units
  return liq;
}

/**
 * Max loss before liquidation at a given current price.
 * Includes optional closing fee bps on current notional.
 */
export function calculateMaxLossBeforeLiquidation(
  collateral: BN,               // USDC
  size: BN,
  currentPrice: BN,             // PRICE_PRECISION
  liquidationThresholdBps: BN,  // bps
  fundingAccumulated: BN = new BN(0), // USDC
  totalFeeBps: BN = new BN(0)         // bps
): BN {
  // maintenance + closing fee = size * price * (lt+fee) / BPS / PP   => USDC
  const ltPlusFee = liquidationThresholdBps.add(totalFeeBps);
  const maintPlusFee = size
    .mul(currentPrice)
    .mul(ltPlusFee)
    .div(BPS_DIVISOR)
    .div(PRICE_PRECISION);

  // equity available to absorb loss
  return collateral.add(fundingAccumulated).sub(maintPlusFee);
}

/**
 * Checks if a position is liquidatable at currentPrice.
 * Includes optional closing fee bps on current notional.
 */
export function isPositionLiquidatable(
  entryPrice: BN,               // PRICE_PRECISION
  currentPrice: BN,             // PRICE_PRECISION
  collateral: BN,               // USDC
  size: BN,
  liquidationThresholdBps: BN,  // bps
  isLong: boolean,
  fundingAccumulated: BN = new BN(0), // USDC
  totalFeeBps: BN = new BN(0)         // bps
): boolean {
  // PnL = (current - entry) * size * dir / PP   => USDC
  const priceDelta = isLong ? currentPrice.sub(entryPrice) : entryPrice.sub(currentPrice);
  const unrealizedPnl = priceDelta.mul(size).div(PRICE_PRECISION);

  const totalEquity = collateral.add(unrealizedPnl).add(fundingAccumulated); // USDC

  // min collateral = size * price * (lt+fee) / BPS / PP   => USDC
  const ltPlusFee = liquidationThresholdBps.add(totalFeeBps);
  const minCollateral = size
    .mul(currentPrice)
    .mul(ltPlusFee)
    .div(BPS_DIVISOR)
    .div(PRICE_PRECISION);

  return totalEquity.lt(minCollateral);
}
