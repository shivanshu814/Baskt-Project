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
      ttl: parseInt(process.env.CACHE_TTL || '5000', 10),
      maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
    },
    features: {
      enableCascadeCheck: process.env.ENABLE_CASCADE_CHECK === 'true',
      enableLiquidityCheck: process.env.ENABLE_LIQUIDITY_CHECK === 'true',
    }
  };

  // Override with environment variables if needed here
  if (process.env.MAX_LEVERAGE) {
    baseConfig.riskLimits.maxLeverage = parseFloat(process.env.MAX_LEVERAGE);
  }
  if (process.env.MAX_USER_EXPOSURE) {
    baseConfig.riskLimits.maxUserExposure = process.env.MAX_USER_EXPOSURE;
  }
  if (process.env.MAX_POSITIONS_PER_USER) {
    baseConfig.riskLimits.maxPositionsPerUser = parseInt(process.env.MAX_POSITIONS_PER_USER, 10);
  }
  if (process.env.BOOTSTRAP_THRESHOLD_RATIO) {
    baseConfig.riskLimits.bootstrapThresholdRatio = parseFloat(process.env.BOOTSTRAP_THRESHOLD_RATIO);
  }

  return baseConfig;
}
