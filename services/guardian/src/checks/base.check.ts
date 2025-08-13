import { RiskCheck, RiskCheckContext, RiskCheckResult } from '../types';
import { logger } from '../utils/logger';

export abstract class BaseRiskCheck implements RiskCheck {
  abstract name: string;
  enabled: boolean = true;

  abstract performCheck(context: RiskCheckContext): Promise<RiskCheckResult>;

  async check(context: RiskCheckContext): Promise<RiskCheckResult> {
    if (!this.enabled) {
      return {
        passed: true,
        checkName: this.name,
        details: { skipped: true }
      };
    }

    const startTime = Date.now();
    try {
      const result = await this.performCheck(context);
      const duration = Date.now() - startTime;

      logger.debug({
        check: this.name,
        duration,
        passed: result.passed
      }, 'Risk check completed');

      return { ...result, checkName: this.name };
    } catch (error) {
      logger.error({ check: this.name, error }, 'Risk check error');
      return {
        passed: false,
        checkName: this.name,
        reason: `${this.name} check failed`,
        severity: 'high'
      };
    }
  }
}
