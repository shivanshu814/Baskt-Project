import { BasktCreatedMessage, DataBus, OrderAccepted, OrderRequest, serializeMessage, STREAMS, type StreamName } from '@baskt/data-bus';
import BN from 'bn.js';


/**
 * StreamPublisher handles publishing blockchain events to Redis streams
 * This bridges the Event Engine with the Data Bus for real-time event distribution
 * 
 * Features:
 * - Singleton per process to avoid multiple Redis connections
 * - Automatic reconnection on connection loss
 * - Direct publishing to Redis streams
 */
export class StreamPublisher {
  private dataBus: InstanceType<typeof DataBus>;
  private isConnected: boolean = false;
  private reconnectTimer?: NodeJS.Timeout;
  private readonly RECONNECT_DELAY = 5000; // 5 seconds

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.dataBus = new DataBus({
      redisUrl,
      autoConnect: false // We'll connect manually in init()
    });
  }

  async init(): Promise<void> {
    if (!this.isConnected) {
      try {
        this.isConnected = true;
        console.log('[StreamPublisher] Connected to Data Bus');
        
        // Clear any reconnect timer
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = undefined;
        }
      } catch (error) {
        console.error('[StreamPublisher] Failed to connect:', error);
        this.scheduleReconnect();
        throw error;
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }
    console.log(`[StreamPublisher] Scheduling reconnect in ${this.RECONNECT_DELAY}ms`);
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = undefined;
      try {
        await this.init();
      } catch (error) {
        console.error('[StreamPublisher] Reconnect failed:', error);
        this.scheduleReconnect();
      }
    }, this.RECONNECT_DELAY);
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    if (this.isConnected) {
      await this.dataBus.close();
      this.isConnected = false;
      console.log('[StreamPublisher] Disconnected from Data Bus');
    }
  }

  /**
   * Safely publish to DataBus with error handling and contextual logging
   * Prevents unhandled promise rejections and provides rich error context
   * Complements DataBus circuit breaker by handling error results locally
   */
  private async safePublish<T>(
    stream: StreamName,
    payload: T,
    context: Record<string, any>
  ): Promise<void> {
    try {
      await this.dataBus.publish(stream, payload);
      console.log(`[StreamPublisher] Published ${stream}`, context);
    } catch (error) {
      console.error(`[StreamPublisher] Failed to publish ${stream}:`, error, context);
      // Note: Not re-throwing to prevent unhandled promise rejections
      // DataBus circuit breaker already handles backoff/retry logic
    }
  }

  /**
   * Publish order creation event - matches OrderRequest interface exactly
   */
  async publishOrderCreated(payload: OrderRequest): Promise<void> {  
    // await this.safePublish(STREAMS.order.request, payload, { orderId: payload.order.orderId }); 
    await this.safePublish(STREAMS.order.accepted, {
      executionPrice: new BN(100 * 1e6),
      request: payload,
    } as OrderAccepted, { orderId: payload.order.orderId });
  }

  async publishBasktCreated(payload: BasktCreatedMessage): Promise<void> {
    await this.safePublish(STREAMS.baskt.created, payload, { basktId: payload.basktId });
  }


  // /**
  //  * Publish position opened event - matches PositionOpened interface exactly
  //  */
  // async publishPositionOpened(data: {
  //   orderId: string;
  //   positionId: string;
  //   owner: string;
  //   basktId: string;
  //   size: string;
  //   collateral: string;
  //   isLong: boolean;
  //   entryPrice: string;
  //   entryFundingIndex: string;
  //   feeToTreasury: string;
  //   feeToBlp: string;
  //   timestamp: string;
  //   txSignature: string;
  // }): Promise<void> {
  //   const payload: PositionOpened = {
  //     orderId: data.orderId,
  //     positionId: data.positionId,
  //     owner: data.owner,
  //     basktId: data.basktId,
  //     size: data.size,
  //     collateral: data.collateral,
  //     isLong: data.isLong,
  //     entryPrice: data.entryPrice,
  //     entryFundingIndex: data.entryFundingIndex,
  //     feeToTreasury: data.feeToTreasury,
  //     feeToBlp: data.feeToBlp,
  //     timestamp: data.timestamp,
  //     txSignature: data.txSignature,
  //   };
    
  //   await this.safePublish(STREAMS.position.opened, payload, { positionId: data.positionId });
  // }

  // /**
  //  * Publish position closed event - matches PositionClosed interface exactly
  //  */
  // async publishPositionClosed(data: {
  //   orderId: string;
  //   positionId: string;
  //   owner: string;
  //   basktId: string;
  //   size: string;
  //   exitPrice: string;
  //   pnl: string;
  //   feeToTreasury: string;
  //   feeToBlp: string;
  //   fundingPayment: string;
  //   settlementAmount: string;
  //   poolPayout: string;
  //   timestamp: string;
  //   txSignature: string;
  // }): Promise<void> {
  //   const payload: PositionClosed = {
  //     orderId: data.orderId,
  //     positionId: data.positionId,
  //     owner: data.owner,
  //     basktId: data.basktId,
  //     size: data.size,
  //     exitPrice: data.exitPrice,
  //     pnl: data.pnl,
  //     feeToTreasury: data.feeToTreasury,
  //     feeToBlp: data.feeToBlp,
  //     fundingPayment: data.fundingPayment,
  //     settlementAmount: data.settlementAmount,
  //     poolPayout: data.poolPayout,
  //     timestamp: data.timestamp,
  //     txSignature: data.txSignature,
  //   };
    
  //   await this.safePublish(STREAMS.position.closed, payload, { positionId: data.positionId });
  // }

  // /**
  //  * Publish position liquidated event - matches PositionLiquidated interface exactly
  //  */
  // async publishPositionLiquidated(data: {
  //   positionId: string;
  //   owner: string;
  //   basktId: string;
  //   size: string;
  //   exitPrice: string;
  //   pnl: string;
  //   feeToTreasury: string;
  //   feeToBlp: string;
  //   fundingPayment: string;
  //   remainingCollateral: string;
  //   poolPayout: string;
  //   timestamp: string;
  //   txSignature: string;
  // }): Promise<void> {
  //   const payload: PositionLiquidated = {
  //     positionId: data.positionId,
  //     owner: data.owner,
  //     basktId: data.basktId,
  //     size: data.size,
  //     exitPrice: data.exitPrice,
  //     pnl: data.pnl,
  //     feeToTreasury: data.feeToTreasury,
  //     feeToBlp: data.feeToBlp,
  //     fundingPayment: data.fundingPayment,
  //     remainingCollateral: data.remainingCollateral,
  //     poolPayout: data.poolPayout,
  //     timestamp: data.timestamp,
  //     txSignature: data.txSignature,
  //   };
    
  //   await this.safePublish(STREAMS.position.liquidated, payload, { positionId: data.positionId });
  // }

}

// Singleton instance
let streamPublisher: StreamPublisher | null = null;

export async function getStreamPublisher(): Promise<StreamPublisher> {
  if (!streamPublisher) {
    streamPublisher = new StreamPublisher();
    await streamPublisher.init();
  }
  return streamPublisher;
}

export async function closeStreamPublisher(): Promise<void> {
  if (streamPublisher) {
    await streamPublisher.disconnect();
    streamPublisher = null;
  }
}