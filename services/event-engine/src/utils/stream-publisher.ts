import { DataBus, STREAMS, type StreamName } from '@baskt/data-bus';
import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { OrderAction, OrderType } from '@baskt/types';
import type {
  OrderRequest,
  OrderAccepted,
  OrderRejected,
  PositionOpened,
  PositionClosed,
  PositionLiquidated,
  TransactionSubmitted,
  TransactionConfirmed,
  TransactionFailed,
  FundingUpdate,
  BasketNav
} from '@baskt/shared';

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
    const signingKey = process.env.DATABUS_SIGNING_KEY || 'dev-signing-key';
    this.dataBus = new DataBus({
      redisUrl,
      signingKey,
      autoConnect: false // We'll connect manually in init()
    });
  }

  async init(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.dataBus.connect();
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

  private formatPublicKey(key: PublicKey | string): string {
    return typeof key === 'string' ? key : key.toString();
  }

  private formatBN(value: InstanceType<typeof BN> | string | number): string {
    if (value instanceof BN) {
      return value.toString();
    }
    return value.toString();
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
      console.error(`[StreamPublisher] Failed to publish ${stream}:`, {
        ...context,
        error: error instanceof Error ? error.message : String(error)
      });
      // Note: Not re-throwing to prevent unhandled promise rejections
      // DataBus circuit breaker already handles backoff/retry logic
    }
  }

  /**
   * Publish order creation event - matches OrderRequest interface exactly
   */
  async publishOrderCreated(data: {
    orderId: InstanceType<typeof BN> | string;
    owner: PublicKey | string;
    basktId: PublicKey | string;
    size: InstanceType<typeof BN> | string;
    collateral: InstanceType<typeof BN> | string;
    isLong: boolean;
    action: OrderAction;
    targetPosition?: PublicKey | null;
    orderType: OrderType;
    limitPrice: InstanceType<typeof BN> | string;
    maxSlippageBps: InstanceType<typeof BN> | string;
    leverageBps: InstanceType<typeof BN> | string;
    timestamp: InstanceType<typeof BN> | string;
    signature: string;
  }): Promise<void> {
    const payload: OrderRequest = {
      orderId: this.formatBN(data.orderId),
      owner: this.formatPublicKey(data.owner),
      basktId: this.formatPublicKey(data.basktId),
      size: this.formatBN(data.size),
      collateral: this.formatBN(data.collateral),
      isLong: data.isLong,
      action: data.action,
      targetPosition: data.targetPosition ? this.formatPublicKey(data.targetPosition) : null,
      orderType: data.orderType,
      limitPrice: this.formatBN(data.limitPrice),
      maxSlippageBps: this.formatBN(data.maxSlippageBps),
      leverageBps: this.formatBN(data.leverageBps),
      timestamp: this.formatBN(data.timestamp),
      txSignature: data.signature,
    };
    
    await this.safePublish(STREAMS.order.request, payload, { orderId: payload.orderId });
  }

  /**
   * Publish order acceptance (filled) event - matches OrderAccepted interface exactly
   */
  async publishOrderAccepted(data: {
    orderId: string;
    owner: string;
    basktId: string;
    action: OrderAction;
    size: string;
    fillPrice: string;
    positionId: string | null;
    targetPosition: string | null;
    timestamp: string;
    txSignature: string;
  }): Promise<void> {
    const payload: OrderAccepted = {
      orderId: data.orderId,
      owner: data.owner,
      basktId: data.basktId,
      action: data.action,
      size: data.size,
      fillPrice: data.fillPrice,
      positionId: data.positionId,
      targetPosition: data.targetPosition,
      timestamp: data.timestamp,
      txSignature: data.txSignature,
    };
    
    await this.safePublish(STREAMS.order.accepted, payload, { orderId: data.orderId });
  }

  /**
   * Publish order rejection/cancellation event - matches OrderRejected interface exactly
   */
  async publishOrderRejected(data: {
    orderId: string;
    owner: string;
    basktId: string;
    reason: string;
    timestamp: string;
  }): Promise<void> {
    const payload: OrderRejected = {
      orderId: data.orderId,
      owner: data.owner,
      basktId: data.basktId,
      reason: data.reason,
      timestamp: data.timestamp,
    };
    
    await this.safePublish(STREAMS.order.rejected, payload, { orderId: data.orderId });
  }

  /**
   * Publish position opened event - matches PositionOpened interface exactly
   */
  async publishPositionOpened(data: {
    orderId: string;
    positionId: string;
    owner: string;
    basktId: string;
    size: string;
    collateral: string;
    isLong: boolean;
    entryPrice: string;
    entryFundingIndex: string;
    feeToTreasury: string;
    feeToBlp: string;
    timestamp: string;
    txSignature: string;
  }): Promise<void> {
    const payload: PositionOpened = {
      orderId: data.orderId,
      positionId: data.positionId,
      owner: data.owner,
      basktId: data.basktId,
      size: data.size,
      collateral: data.collateral,
      isLong: data.isLong,
      entryPrice: data.entryPrice,
      entryFundingIndex: data.entryFundingIndex,
      feeToTreasury: data.feeToTreasury,
      feeToBlp: data.feeToBlp,
      timestamp: data.timestamp,
      txSignature: data.txSignature,
    };
    
    await this.safePublish(STREAMS.position.opened, payload, { positionId: data.positionId });
  }

  /**
   * Publish position closed event - matches PositionClosed interface exactly
   */
  async publishPositionClosed(data: {
    orderId: string;
    positionId: string;
    owner: string;
    basktId: string;
    size: string;
    exitPrice: string;
    pnl: string;
    feeToTreasury: string;
    feeToBlp: string;
    fundingPayment: string;
    settlementAmount: string;
    poolPayout: string;
    timestamp: string;
    txSignature: string;
  }): Promise<void> {
    const payload: PositionClosed = {
      orderId: data.orderId,
      positionId: data.positionId,
      owner: data.owner,
      basktId: data.basktId,
      size: data.size,
      exitPrice: data.exitPrice,
      pnl: data.pnl,
      feeToTreasury: data.feeToTreasury,
      feeToBlp: data.feeToBlp,
      fundingPayment: data.fundingPayment,
      settlementAmount: data.settlementAmount,
      poolPayout: data.poolPayout,
      timestamp: data.timestamp,
      txSignature: data.txSignature,
    };
    
    await this.safePublish(STREAMS.position.closed, payload, { positionId: data.positionId });
  }

  /**
   * Publish position liquidated event - matches PositionLiquidated interface exactly
   */
  async publishPositionLiquidated(data: {
    positionId: string;
    owner: string;
    basktId: string;
    size: string;
    exitPrice: string;
    pnl: string;
    feeToTreasury: string;
    feeToBlp: string;
    fundingPayment: string;
    remainingCollateral: string;
    poolPayout: string;
    timestamp: string;
    txSignature: string;
  }): Promise<void> {
    const payload: PositionLiquidated = {
      positionId: data.positionId,
      owner: data.owner,
      basktId: data.basktId,
      size: data.size,
      exitPrice: data.exitPrice,
      pnl: data.pnl,
      feeToTreasury: data.feeToTreasury,
      feeToBlp: data.feeToBlp,
      fundingPayment: data.fundingPayment,
      remainingCollateral: data.remainingCollateral,
      poolPayout: data.poolPayout,
      timestamp: data.timestamp,
      txSignature: data.txSignature,
    };
    
    await this.safePublish(STREAMS.position.liquidated, payload, { positionId: data.positionId });
  }

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