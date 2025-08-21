import { ObserverRouter } from '../../observer-router';
import { EventSource } from '../../types';

import basktCreatedHandler from './baskt-created';
import rebalanceRequestHandler from './baskt-rebalance-request';
import basktRebalancedHandler from './baskt-rebalanced';
import orderCreatedHandler from './order-created';
import positionOpenedHandler from './position-opened';
import positionClosedHandler from './position-closed';
import positionLiquidatedHandler from './position-liquidated';
import orderCancelledHandler from './order-cancelled';
import collateralAddedHandler from './collateral-added';
import liquidityAddedHandler from './liquidity-added';
import protocolStateUpdatedHandler from './protocol-state-updated';
import basktConfigUpdatedHandler from './baskt-config-updated';
import withdrawalQueuedHandler from './withdrawal-queued';
import withdrawQueueProcessedHandler from './withdraw-queue-processed';
import { basktClosedHandler, basktDecommissioningInitiatedHandler } from './baskt-lifecycle';
import basktActivatedHandler from './baskt-activated';

export default function registerAllHandlers(router: ObserverRouter) {
  // Register baskt handlers
  router.register(EventSource.SOLANA, basktCreatedHandler.type, basktCreatedHandler.handler);
  router.register(EventSource.SOLANA, rebalanceRequestHandler.type, rebalanceRequestHandler.handler);
  router.register(EventSource.SOLANA, basktRebalancedHandler.type, basktRebalancedHandler.handler);
  router.register(EventSource.SOLANA, basktConfigUpdatedHandler.type, basktConfigUpdatedHandler.handler);
  router.register(EventSource.SOLANA, basktClosedHandler.type, basktClosedHandler.handler);
  router.register(EventSource.SOLANA, basktDecommissioningInitiatedHandler.type, basktDecommissioningInitiatedHandler.handler);
  router.register(EventSource.SOLANA, basktActivatedHandler.type, basktActivatedHandler.handler);
  
  // Register order handlers
  router.register(EventSource.SOLANA, orderCreatedHandler.type, orderCreatedHandler.handler);
  router.register(EventSource.SOLANA, orderCancelledHandler.type, orderCancelledHandler.handler);
  
  // Register position handlers
  router.register(EventSource.SOLANA, positionOpenedHandler.type, positionOpenedHandler.handler);
  router.register(EventSource.SOLANA, positionClosedHandler.type, positionClosedHandler.handler);
  router.register(EventSource.SOLANA, positionLiquidatedHandler.type, positionLiquidatedHandler.handler);
  router.register(EventSource.SOLANA, collateralAddedHandler.type, collateralAddedHandler.handler);
  
  // Register liquidity handlers
  router.register(EventSource.SOLANA, liquidityAddedHandler.type, liquidityAddedHandler.handler);

  // Register protocol state handlers
  router.register(EventSource.SOLANA, protocolStateUpdatedHandler.type, protocolStateUpdatedHandler.handler);
  
  // Register withdrawal handlers
  router.register(EventSource.SOLANA, withdrawalQueuedHandler.type, withdrawalQueuedHandler.handler);
  router.register(EventSource.SOLANA, withdrawQueueProcessedHandler.type, withdrawQueueProcessedHandler.handler);
}
