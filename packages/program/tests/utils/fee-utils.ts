import { NAV_PRECISION, PRICE_PRECISION } from '@baskt/sdk';
import BN from 'bn.js';

/**
 * Basis points divisor (10,000 = 100%)
 */
export const BPS_DIVISOR = new BN(10_000);

/**
 * Generic fee calculation helper
 * amount * fee_bps / BPS_DIVISOR
 */
export function calcFee(amount: BN, feeBps: BN): BN {
  return amount.mul(feeBps).div(BPS_DIVISOR);
}

/**
 * Compute net collateral after deducting opening fee from collateral
 */
export function netCollateral(collateral: BN, size: BN, openingFeeBps: BN): BN {
  return collateral.sub(calcFee(size, openingFeeBps));
}

export function calculateSettlementDetails(
  collateral: BN,
  numOfContractsToClose: BN,
  feeBps: BN, 
  fundingAccumulated: BN,
  entryPrice: BN,
  exitPrice: BN,
  isLong: boolean,
  treasuryCutBps: BN,
  rebalanceFeeOwed: BN = new BN(0),
  isLiquidation: boolean = false,
): {
  feeToTreasury: BN;
  feeToBLP: BN;
  collateralReturned: BN;
  escrowToBLP: BN;
  expectedUserPayout: BN;
  poolToUser: BN;
  isBadDebt: boolean;
} {



  let fundingPaidByUser = fundingAccumulated.gt(new BN(0)) ? fundingAccumulated : new BN(0);
  let fundingPaidByPool = fundingAccumulated.lt(new BN(0)) ? fundingAccumulated.abs() : new BN(0);

  const priceDelta = isLong ? exitPrice.sub(entryPrice) : entryPrice.sub(exitPrice); 
  const pnl = priceDelta.mul(numOfContractsToClose).div(PRICE_PRECISION); 

  const exitNotional = numOfContractsToClose.mul(exitPrice).div(PRICE_PRECISION);
  const closingFee = exitNotional.mul(feeBps).div(BPS_DIVISOR);
  
  // Total fees include closing fee + rebalance fee
  const totalFees = closingFee.add(rebalanceFeeOwed);
 
  const netCollateral = collateral.sub(totalFees); 
  const userEquity = netCollateral.add(pnl).add(fundingAccumulated);

  if(userEquity.lt(new BN(0))) { 
    return {
      feeToTreasury: new BN(0),
      feeToBLP: new BN(0),
      collateralReturned: new BN(0),
      escrowToBLP: collateral,
      expectedUserPayout: new BN(0),
      poolToUser: new BN(0),
      isBadDebt: true,
    }
  }
  let treasuryCut = totalFees.mul(treasuryCutBps).div(BPS_DIVISOR); 

  if(isLiquidation) {
    const treasuryCut = totalFees.mul(treasuryCutBps).div(BPS_DIVISOR); 
    const escrowToBLP = collateral.sub(treasuryCut);
    return {
      feeToTreasury: treasuryCut,
      feeToBLP: new BN(0),
      collateralReturned: new BN(0),
      escrowToBLP,
      expectedUserPayout: new BN(0),
      poolToUser: new BN(0),
      isBadDebt: false,
    }
  }


  let expectedUserPayout = netCollateral.add(pnl).add(fundingPaidByPool);
  let escrowToBLP = fundingPaidByUser.add(pnl.lt(new BN(0)) ? pnl.abs() : new BN(0)).add(totalFees.sub(treasuryCut));
  let poolToUser = fundingPaidByPool.add(pnl.gt(new BN(0)) ? pnl : new BN(0));


  return {

    // From Escrow
    feeToTreasury: treasuryCut,
    feeToBLP: totalFees.sub(treasuryCut),
    collateralReturned: netCollateral,
    escrowToBLP,    
    expectedUserPayout,
    // How much does the pool pay to the user
    poolToUser,
    isBadDebt: false,
  }
}