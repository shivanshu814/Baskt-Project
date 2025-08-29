import BN from 'bn.js';
import { BaseRiskCheck } from './base.check';
import { RiskCheckContext, RiskCheckResult } from '../types';
import { GuardianCache } from '../utils/cache';

import { MAX_ORDER_SIZE } from '@baskt/sdk';
import { querierClient } from '../config/client';
import { OrderAction, PositionStatus } from '@baskt/types';

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
      
      // Validate that size is positive and a whole number (contracts are indivisible)
      if (requestedSize.lte(new BN(0))) {
        return {
          passed: false,
          checkName: this.name,
          reason: 'Requested close size must be greater than 0',
          severity: 'high',
          details: {
            size: requestedSize.toString()
          }
        };
      }
      const position = await querierClient.getBasktClient().getPosition(orderRequest.order.closeParams!.targetPosition);
      if(!position) {
        return {
          passed: false,
          checkName: this.name,
          reason: 'Target position not found',
          severity: 'high',
          details: {
            targetPosition: orderRequest.order.closeParams!.targetPosition.toString()
          }
        };
      }
  
      // Validate position ownership (not checked in create_order, only in close_position)
      if (position.owner.toString() !== orderRequest.order.owner.toString()) {
        return {
          passed: false,
          checkName: this.name,
          reason: 'Position not owned by order creator',
          severity: 'critical',
          details: {
            positionOwner: position.owner.toString(),
            orderOwner: orderRequest.order.owner.toString()
          }
        };
      }

      // Validate position baskt matches order baskt (not checked in create_order)
      if (position.basktId.toString() !== orderRequest.order.basktId.toString()) {
        return {
          passed: false,
          checkName: this.name,
          reason: 'Position baskt does not match order baskt',
          severity: 'high',
          details: {
            positionBaskt: position.basktId.toString(),
            orderBaskt: orderRequest.order.basktId.toString()
          }
        };
      }

      // Validate position status is OPEN (not checked in create_order)
      // SDK already converts status to PositionStatus enum
      if (position.status !== PositionStatus.OPEN) {
        return {
          passed: false,
          checkName: this.name,
          reason: `Position is not open (status: ${position.status})`,
          severity: 'high',
          details: { 
            positionStatus: position.status,
            positionId: position.positionId
          }
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
          positionSize: positionSize.toString(),
          positionOwner: position.owner.toString(),
          isPartialClose: requestedSize.lt(positionSize)
        }
      };
    } catch(error) {
      return {
        passed: false,
        checkName: this.name,
        reason: 'Failed to validate position',
        severity: 'critical',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          targetPosition: orderRequest.order.closeParams?.targetPosition?.toString()
        }
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
