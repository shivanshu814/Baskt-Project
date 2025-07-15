import { ObserverRouter } from 'src/observer-router';
import { EventSource } from 'src/types';

import basktCreatedHandler from './baskt-created';
import orderCreatedHandler from './order-created';
import positionOpenedHandler from './position-opened';
import positionClosedHandler from './position-closed';
import positionLiquidatedHandler from './position-liquidated';
import orderCancelledHandler from './order-cancelled';
import collateralAddedHandler from './collateral-added';
import liquidityAddedHandler from './liquidity-added';
import liquidityRemovedHandler from './liquidity-removed';

export default function registerAllHandlers(router: ObserverRouter) {
  router.register(EventSource.SOLANA, basktCreatedHandler.type, basktCreatedHandler.handler);
  router.register(EventSource.SOLANA, orderCreatedHandler.type, orderCreatedHandler.handler);
  router.register(EventSource.SOLANA, positionOpenedHandler.type, positionOpenedHandler.handler);
  router.register(EventSource.SOLANA, positionClosedHandler.type, positionClosedHandler.handler);
  router.register(
    EventSource.SOLANA,
    positionLiquidatedHandler.type,
    positionLiquidatedHandler.handler,
  );
  router.register(EventSource.SOLANA, orderCancelledHandler.type, orderCancelledHandler.handler);
  router.register(EventSource.SOLANA, collateralAddedHandler.type, collateralAddedHandler.handler);
  router.register(EventSource.SOLANA, liquidityAddedHandler.type, liquidityAddedHandler.handler);
  router.register(EventSource.SOLANA, liquidityRemovedHandler.type, liquidityRemovedHandler.handler);
}
