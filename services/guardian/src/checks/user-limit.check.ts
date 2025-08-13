import { BaseRiskCheck } from './base.check';
import { RiskCheckContext, RiskCheckResult } from '../types';
import { GuardianCache } from '../utils/cache';
import { querierClient } from '../config/client';

export class UserLimitCheck extends BaseRiskCheck {
  name = 'user-position-limit';

  constructor(
    private cache: GuardianCache,
    private maxPositions: number
  ) {
    super();
  }

  async performCheck(context: RiskCheckContext): Promise<RiskCheckResult> {
    const { orderRequest } = context;

    const cacheKey = `user-positions:${orderRequest.order.owner}`;
    let positionCount = this.cache.get<number>(cacheKey);

    if (!positionCount) {
      const result = await querierClient.position.getPositions({
        userId: orderRequest.order.owner.toString(),
        isActive: true
      });

      if (!result.success) {
        return {
          passed: false,
          checkName: this.name,
          reason: 'Failed to fetch user positions',
          severity: 'critical'
        };
      }

      positionCount = result.data?.length || 0;
      this.cache.set(cacheKey, positionCount);
    }

    if (positionCount! >= this.maxPositions) {
      return {
        passed: false,
        checkName: this.name,
        reason: `User has ${positionCount} positions, limit is ${this.maxPositions}`,
        severity: 'medium',
        details: {
          currentPositions: positionCount,
          maxAllowed: this.maxPositions
        }
      };
    }

    return {
      passed: true,
      checkName: this.name,
      details: {
        currentPositions: positionCount,
        maxAllowed: this.maxPositions
      }
    };
  }
}
