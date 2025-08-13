import { OrderRequest } from '@baskt/data-bus';
import BN from 'bn.js';

export interface RiskCheckContext {
  orderRequest: OrderRequest;
  executionPrice: BN;  // The price at which the order will be executed
  userPositions?: any[];
  basketData?: any;
  poolData?: any;
}

export interface RiskCheckResult {
  passed: boolean;
  checkName: string;
  reason?: string;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskCheck {
  name: string;
  enabled: boolean;
  check(context: RiskCheckContext): Promise<RiskCheckResult>;
}

export interface GuardianConfig {
  maxPositionSize?: BN; // Optional override for position size limit
  riskLimits: {
    maxLeverage?: number;
    maxUserExposure?: string;
    maxUtilization?: number;
    maxSkewRatio?: number;
    maxPositionsPerUser?: number;
    minLiquidityBuffer?: number; // Buffer ratio for liquidity check
    bootstrapThresholdRatio?: number; // Ratio of BLP below which skew check is skipped
  };
  cache: {
    ttl: number;
    maxSize: number;
  };
  features: {
    enableCascadeCheck: boolean;
    enableLiquidityCheck: boolean;
  };
}
