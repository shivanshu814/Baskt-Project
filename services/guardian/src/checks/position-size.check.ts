import BN from 'bn.js';
import { BaseRiskCheck } from './base.check';
import { RiskCheckContext, RiskCheckResult } from '../types';
import { GuardianCache } from '../utils/cache';

import {
  isWholeNumberForPrecision
} from '../utils/risk-calculations';
import { MAX_ORDER_SIZE, PRICE_PRECISION, USDC_DECIMALS } from '@baskt/sdk';
import { querierClient } from '../config/client';
import { OrderAction } from '@baskt/types';

export class PositionSizeCheck extends BaseRiskCheck {
  name = 'position-size';

  constructor(
    private cache: GuardianCache,
    private maxPositionSize?: BN
  ) {
    super();
  }

  private async performOpenOrderCheck(context: RiskCheckContext): Promise<RiskCheckResult> {
    const { orderRequest } = context;
    const notionalValue = orderRequest.order.openParams!.notionalValue;


    if(notionalValue.lte(new BN(0))) {
      return {
        passed: false,
        checkName: this.name,
        reason: 'Notional value is less than or equal to 0',
        severity: 'high'
      };
    }

    if(notionalValue.gt(MAX_ORDER_SIZE) ) {
      return {
        passed: false,
        checkName: this.name,
        reason: 'Notional value exceeds maximum order size',
        severity: 'high'
      };
    }

    return {
      passed: true,
      checkName: this.name,
      details: {
        notionalValue: notionalValue.toString()
      }
    };
  }

  private async performCloseOrderCheck(context: RiskCheckContext): Promise<RiskCheckResult> {
    const { orderRequest } = context;

    try {
      const requestedSize = orderRequest.order.closeParams!.sizeAsContracts;
      if (!isWholeNumberForPrecision(requestedSize, PRICE_PRECISION)) {
        return {
          passed: false,
          checkName: this.name,
          reason: `Order size ${requestedSize.toString()} does not respect USDC decimal precision (${USDC_DECIMALS} decimals)`,
          severity: 'medium',
          details: {
            size: requestedSize.toString(),
            precisionRequired: `${USDC_DECIMALS} decimals`,
            remainder: requestedSize.mod(PRICE_PRECISION).toString()
          }
        };
      }
      const position = await querierClient.getBasktClient().getPosition(orderRequest.order.closeParams!.targetPosition);
      if(!position) {
        return {
          passed: false,
          checkName: this.name,
          reason: 'Target position not found',
          severity: 'medium'
        };
      }
  
    
      const positionSize = position.size;
  
      if(requestedSize.gt(positionSize)) {
        return {
          passed: false,
          checkName: this.name,
          reason: 'Requested size is greater than position size',
          severity: 'medium'
        };
      }
      return {
        passed: true,
        checkName: this.name,
        details: {
          requestedSize: requestedSize.toString(),
          positionSize: positionSize.toString()
        }
      };
    } catch(error) {
      return {
        passed: false,
        checkName: this.name,
        reason: 'Failed to fetch position',
        severity: 'medium'
      };
    }

    
  }

  async performCheck(context: RiskCheckContext): Promise<RiskCheckResult> {
    const { orderRequest } = context;

    if(orderRequest.order.action === OrderAction.Open) {
      return this.performOpenOrderCheck(context);
    } else {
      return this.performCloseOrderCheck(context);
    }
  }
}
