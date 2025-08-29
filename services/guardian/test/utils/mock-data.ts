import BN from 'bn.js';
import { PoolState, OrderDetails, FeeSkewConfig } from '../../src/utils/fee-skew-calculator';

export const mockConfig: FeeSkewConfig = {
  impactScalar: new BN('1500000000'), // 1.5B
  targetUtilization: 0.8,
  minBorrowRate: 0.01,    // 1%
  targetBorrowRate: 0.05, // 5%
  maxBorrowRate: 0.15,    // 15%
  maxImbalanceRatio: 0.2, // 20%
  imbalancePenaltyBps: 10,
  maxPositionSizeUsd: new BN('2500000'), // 2.5M
  poolImpactThreshold: 0.05 // 5%
};

export const mockPoolStates = {
  balanced: {
    totalLiquidity: new BN('10000000'), // $10M
    utilization: 0.5,
    longNotional: new BN('2500000'),
    shortNotional: new BN('2500000')
  } as PoolState,
  
  highUtilization: {
    totalLiquidity: new BN('10000000'), // $10M
    utilization: 0.9,
    longNotional: new BN('4500000'),
    shortNotional: new BN('4500000')
  } as PoolState,
  
  longSkewed: {
    totalLiquidity: new BN('10000000'), // $10M
    utilization: 0.5,
    longNotional: new BN('3500000'),
    shortNotional: new BN('1500000')
  } as PoolState,
  
  shortSkewed: {
    totalLiquidity: new BN('10000000'), // $10M
    utilization: 0.5,
    longNotional: new BN('1500000'),
    shortNotional: new BN('3500000')
  } as PoolState
};

export const mockOrders = {
  smallLong: {
    isLong: true,
    notionalValue: new BN('100000'), // $100k
    isOpen: true
  } as OrderDetails,
  
  largeLong: {
    isLong: true,
    notionalValue: new BN('1000000'), // $1M
    isOpen: true
  } as OrderDetails,
  
  smallShort: {
    isLong: false,
    notionalValue: new BN('100000'), // $100k
    isOpen: true
  } as OrderDetails,
  
  largeShort: {
    isLong: false,
    notionalValue: new BN('1000000'), // $1M
    isOpen: true
  } as OrderDetails,
  
  closeLong: {
    isLong: true,
    notionalValue: new BN('100000'), // $100k
    isOpen: false
  } as OrderDetails,
  
  closeShort: {
    isLong: false,
    notionalValue: new BN('100000'), // $100k
    isOpen: false
  } as OrderDetails
};

export const mockQuerierResponses = {
  normalPool: {
    success: true,
    data: {
      totalLiquidity: '10000000'
    }
  },
  
  normalOI: {
    success: true,
    data: {
      longOpenInterest: '2500000',
      shortOpenInterest: '2500000'
    }
  },
  
  skewedOI: {
    success: true,
    data: {
      longOpenInterest: '3500000',
      shortOpenInterest: '1500000'
    }
  }
};
