import { GuardianConfig } from '../types';
import { MAX_LEVERAGE, MAX_USER_EXPOSURE, MAX_UTILIZATION, MAX_SKEW_RATIO } from '@baskt/data-bus';
export function loadConfig(): GuardianConfig {
  // Start with shared constants
  const baseConfig: GuardianConfig = {
    riskLimits: {
      maxLeverage: MAX_LEVERAGE,
      maxUserExposure: MAX_USER_EXPOSURE.toString(),
      maxUtilization: MAX_UTILIZATION,
      maxSkewRatio: MAX_SKEW_RATIO,
      maxPositionsPerUser: 50, // Not in shared constants
      bootstrapThresholdRatio: 0.1, // 10% of BLP liquidity
    },
    cache: {
      ttl: 5000,
      maxSize: 1000,
    },
  };

  // Override with environment variables if needed here
  baseConfig.riskLimits.maxLeverage = 10000;
  baseConfig.riskLimits.maxUserExposure = Number(100_000 * 1e6).toString();
  baseConfig.riskLimits.maxPositionsPerUser = 20;
  baseConfig.riskLimits.bootstrapThresholdRatio = 0.1;

  return baseConfig;
}
