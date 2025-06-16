import BN from 'bn.js';
import { OnchainAssetConfig } from '@baskt/types';
import { calculateNav } from '@baskt/sdk';

export function generateDailyNavHistory(baselineconfig: OnchainAssetConfig[], baselineNav: BN) {
  return Array(365)
    .fill(0)
    .map((_, i) => ({
      // format as yyyy-mm-dd
      date: new Date(Date.now() - (365 - i) * 86400000).toISOString().split('T')[0],
      // price: calculateNav(
      //   baselineconfig.map((asset) => ({
      //     ...asset,
      //     baselinePrice: new BN(1e6),
      //   })),
      //   baselineconfig.map((asset) => ({
      //     ...asset,
      //     baselinePrice: new BN(Math.random() * 2 * 1e6),
      //   })),
      //   baselineNav,
      // ),
      price: new BN(Math.random() * 2 * 1e6),
    }));
}

export function generateNavHistory(baselineconfig: OnchainAssetConfig[], baselineNav: BN) {
  const dailyHistory = generateDailyNavHistory(baselineconfig, baselineNav);

  // Generate weekly history by taking every 7th day
  const weeklyHistory = dailyHistory.filter((_, index) => index % 7 === 0);

  // Generate monthly history by taking every 30th day
  const monthlyHistory = dailyHistory.filter((_, index) => index % 30 === 0);

  // Generate yearly history by taking every 365th day
  const yearlyHistory = dailyHistory.filter((_, index) => index % 365 === 0);

  return {
    daily: dailyHistory,
    weekly: weeklyHistory,
    monthly: monthlyHistory,
    yearly: yearlyHistory,
  };
}
