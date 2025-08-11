import { BaseClient } from '@baskt/sdk';
import BN from 'bn.js';
import { OrderMetadataModel } from '../models/mongodb';
import { OrderOptions, QueryResult } from '../models/types';
import { CombinedOrder } from '../types/order';
import { handleQuerierError } from '../utils/error-handling';

/**
 * Order Querier
 *
 * This file is used to get order data from MongoDB and Onchain.
 * It is used wherever order info is needed, such as for baskt, asset, and position.
 * It has methods to fetch all orders and combine data from multiple sources.
 */
export class OrderQuerier {
  private basktClient: BaseClient;

  constructor(basktClient: BaseClient) {
    this.basktClient = basktClient;
  }

  /**
   * Get all orders with optional filters
   */
  async getOrders(options: OrderOptions = {}): Promise<QueryResult<CombinedOrder[]>> {
    try {
      const [onchainOrders, orderMetadatas] = await Promise.all([
        this.basktClient.getAllOrders(),
        this.getFilteredOrderMetadata(options),
      ]);

      // Filter onchain orders based on the same criteria as metadata
      let filteredOnchainOrders = onchainOrders;

      if (options.basktId) {
        filteredOnchainOrders = filteredOnchainOrders.filter(
          (order) => order.basktId?.toString() === options.basktId,
        );
      }

      if (options.userId) {
        filteredOnchainOrders = filteredOnchainOrders.filter(
          (order) => order.owner?.toString().toLowerCase() === options.userId?.toLowerCase(),
        );
      }

      if (options.orderStatus) {
        filteredOnchainOrders = filteredOnchainOrders.filter(
          (order) => order.status === options.orderStatus,
        );
      }

      if (options.orderAction) {
        filteredOnchainOrders = filteredOnchainOrders.filter(
          (order) => order.action === options.orderAction,
        );
      }

      const combinedOrders = this.combineOrderData(filteredOnchainOrders, orderMetadatas);

      return {
        success: true,
        data: combinedOrders,
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch orders',
        error: querierError.message,
      };
    }
  }

  /**
   * Build MongoDB filter from options
   */
  private buildMongoFilter(options: OrderOptions): Record<string, any> {
    const filter: Record<string, any> = {};

    if (options.basktId) filter.basktId = options.basktId;
    if (options.userId) filter.owner = { $regex: options.userId, $options: 'i' };
    if (options.orderStatus) filter.orderStatus = options.orderStatus;
    if (options.orderAction) filter.orderAction = options.orderAction;
    if (options.orderPDA) filter.orderPDA = options.orderPDA;

    return filter;
  }

  /**
   * Get filtered order metadata from MongoDB
   */
  private async getFilteredOrderMetadata(options: OrderOptions): Promise<any[]> {
    const filter = this.buildMongoFilter(options);
    return await OrderMetadataModel.find(filter);
  }

  /**
   * Combine onchain orders with metadata
   */
  private combineOrderData(onchainOrders: any[], orderMetadatas: any[]): CombinedOrder[] {
    const onchainOrderPDAs = new Set(
      onchainOrders.map((order) => order.address.toString().toLowerCase()),
    );

    // Map onchain orders with their metadata
    const onchainCombinedOrders = onchainOrders
      .map((onchainOrder) => {
        const meta = orderMetadatas.find(
          (m) => m.orderPDA.toLowerCase() === onchainOrder.address.toString().toLowerCase(),
        );
        return this.convertOrder(onchainOrder, meta);
      })
      .filter((order): order is CombinedOrder => order !== null);

    // Add metadata-only orders (orders that exist in DB but not on-chain)
    const metadataOnlyOrders = orderMetadatas
      .filter((meta) => !onchainOrderPDAs.has(meta.orderPDA.toLowerCase()))
      .map((meta) => this.convertOrder(null, meta))
      .filter((order): order is CombinedOrder => order !== null);

    return [...onchainCombinedOrders, ...metadataOnlyOrders];
  }

  /**
   * Convert order data to CombinedOrder format
   */
  private convertOrder(onchainOrder: any | null, orderMetadata: any): CombinedOrder | null {
    if (!orderMetadata && !onchainOrder) return null;

    // If only metadata exists (no onchain order)
    if (!onchainOrder) {
      return this.createOrderFromMetadata(orderMetadata);
    }

    // If both exist, prioritize onchain data with metadata fallbacks
    return this.createOrderFromBothSources(onchainOrder, orderMetadata);
  }

  /**
   * Calculate USDC size from order size and limit price
   */
  private calculateUsdcSize(size: string, limitPrice: string): string {
    try {
      const sizeBN = new BN(size);
      const priceBN = new BN(limitPrice);
      const usdcSize = sizeBN.mul(priceBN).div(new BN(1000000)); // PRICE_PRECISION
      return usdcSize.toString();
    } catch (error) {
      return '0';
    }
  }

  /**
   * Calculate size from collateral for old orders where size is 0
   */
  private calculateSizeFromCollateral(collateral: string, limitPrice: string): string {
    try {
      const collateralBN = new BN(collateral);
      const priceBN = new BN(limitPrice);
      const size = collateralBN.mul(new BN(1000000)).div(priceBN); // Reverse calculation
      return size.toString();
    } catch (error) {
      return '0';
    }
  }

  /**
   * Create order from metadata only
   */
  private createOrderFromMetadata(orderMetadata: any): CombinedOrder {
    // Extract values from new modular structure or fall back to old flat structure
    const limitPrice = orderMetadata.limitParams?.limitPrice || orderMetadata.limitPrice || '0';
    const maxSlippage =
      orderMetadata.limitParams?.maxSlippageBps || orderMetadata.maxSlippage || '0';
    const collateral = orderMetadata.openParams?.collateral || orderMetadata.collateral || '0';
    const isLong = orderMetadata.openParams?.isLong ?? orderMetadata.isLong ?? false;
    const size =
      orderMetadata.closeParams?.sizeAsContracts ||
      orderMetadata.openParams?.notionalValue ||
      orderMetadata.size ||
      '0';

    const usdcSize = this.calculateUsdcSize(size, limitPrice);

    return {
      orderId: orderMetadata.orderId,
      orderPDA: orderMetadata.orderPDA,
      basktId: orderMetadata.basktId,
      owner: orderMetadata.owner,
      status: orderMetadata.orderStatus,
      action: orderMetadata.orderAction,
      orderType: orderMetadata.orderType,
      timestamp: orderMetadata.timestamp,
      createOrder: orderMetadata.createOrder,
      fullFillOrder: orderMetadata.fullFillOrder,
      position: orderMetadata.position,
      usdcSize: orderMetadata.usdcSize || usdcSize,

      // New modular parameters
      openParams: orderMetadata.openParams,
      closeParams: orderMetadata.closeParams,
      marketParams: orderMetadata.marketParams,
      limitParams: orderMetadata.limitParams,

      // Backward compatibility fields
      size: size,
      collateral: collateral,
      isLong: isLong,
      limitPrice: limitPrice,
      maxSlippage: maxSlippage,
    } as CombinedOrder;
  }

  /**
   * Create order from both onchain and metadata sources
   */
  private createOrderFromBothSources(onchainOrder: any, orderMetadata: any): CombinedOrder {
    // Extract data from onchain order's modular structure
    const onchainLimitPrice =
      onchainOrder.limitParams?.limitPrice?.toString() ||
      onchainOrder.limitPrice?.toString() ||
      '0';
    const onchainMaxSlippage =
      onchainOrder.limitParams?.maxSlippageBps?.toString() ||
      onchainOrder.maxSlippage?.toString() ||
      '0';
    const onchainCollateral =
      onchainOrder.openParams?.collateral?.toString() || onchainOrder.collateral?.toString() || '0';
    const onchainIsLong = onchainOrder.openParams?.isLong ?? onchainOrder.isLong ?? false;

    let size =
      onchainOrder.closeParams?.sizeAsContracts?.toString() ||
      onchainOrder.openParams?.notionalValue?.toString() ||
      onchainOrder.size?.toString() ||
      '0';

    // Fallback: calculate size from collateral if size is 0
    if (size === '0' && onchainCollateral !== '0' && onchainLimitPrice !== '0') {
      size = this.calculateSizeFromCollateral(onchainCollateral, onchainLimitPrice);
    }

    const usdcSize = this.calculateUsdcSize(size, onchainLimitPrice);

    return {
      orderId: onchainOrder.orderId?.toString(),
      orderPDA: onchainOrder.address?.toString(),
      basktId: onchainOrder.basktId?.toString(),
      owner: onchainOrder.owner?.toString(),
      status: onchainOrder.status,
      action: onchainOrder.action,
      orderType: onchainOrder.orderType,
      timestamp: onchainOrder.timestamp?.toString() || orderMetadata?.timestamp,
      createOrder: orderMetadata?.createOrder,
      fullFillOrder: orderMetadata?.fullFillOrder,
      position: orderMetadata?.position,
      usdcSize: orderMetadata?.usdcSize || usdcSize,

      // New modular parameters (prioritize onchain data, fallback to metadata)
      openParams: onchainOrder.openParams || orderMetadata?.openParams,
      closeParams: onchainOrder.closeParams || orderMetadata?.closeParams,
      marketParams: onchainOrder.marketParams || orderMetadata?.marketParams,
      limitParams: onchainOrder.limitParams || orderMetadata?.limitParams,

      // Backward compatibility fields
      size: size,
      collateral: onchainCollateral,
      isLong: onchainIsLong,
      limitPrice: onchainLimitPrice,
      maxSlippage: onchainMaxSlippage,
    } as CombinedOrder;
  }
}
