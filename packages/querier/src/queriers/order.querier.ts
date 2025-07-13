import { OrderMetadataModel } from '../models/mongodb';
import { handleQuerierError } from '../utils/error-handling';
import { OrderOptions, QueryResult } from '../models/types';
import { BaseClient } from '@baskt/sdk';
import { CombinedOrder } from '../types/order';

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
      // Placeholder for onchain orders fetch
      const onchainOrders = await this.basktClient.getAllOrders();

      // Build MongoDB filter
      const filter: any = {};
      if (options.basktId) filter.basktId = options.basktId;
      if (options.userId) filter.owner = { $regex: options.userId, $options: 'i' };
      if (options.orderStatus) filter.orderStatus = options.orderStatus;
      if (options.orderAction) filter.orderAction = options.orderAction;
      if (options.orderPDA) filter.orderPDA = options.orderPDA;

      const orderMetadatas = await OrderMetadataModel.find(filter);
      // Combine onchain and metadata orders
      const combinedOrders = onchainOrders.map((onchainOrder) => {
        const meta = orderMetadatas.find(
          (m: any) => m.orderPDA.toLowerCase() === onchainOrder.address.toString().toLowerCase(),
        );
        return this.convertOrder(onchainOrder, meta);
      });

      // Also include order metadata that don't have corresponding on-chain orders
      const onchainOrderPDAs = onchainOrders.map((order) => order.address.toString().toLowerCase());
      const metadataOnlyOrders = orderMetadatas
        .filter((meta: any) => !onchainOrderPDAs.includes(meta.orderPDA.toLowerCase()))
        .map((meta: any) => this.convertOrder(null, meta))
        .filter((order: any) => order !== null);

      const allOrders = [...combinedOrders, ...metadataOnlyOrders].filter((order): order is CombinedOrder => order !== null);
      const result: QueryResult<CombinedOrder[]> = {
        success: true,
        data: allOrders,
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch orders',
        error: querierError.message,
      };
    }
  }

  private convertOrder(onchainOrder: any | null, orderMetadata: any): CombinedOrder | null {
    if (!orderMetadata) return null;

    if (!onchainOrder) {
      return {
        orderId: orderMetadata.orderId,
        orderPDA: orderMetadata.orderPDA,
        basktId: orderMetadata.basktId,
        owner: orderMetadata.owner,
        status: orderMetadata.orderStatus,
        action: orderMetadata.orderAction,
        size: orderMetadata.size || '0',
        collateral: orderMetadata.collateral || '0',
        isLong: orderMetadata.isLong,
        createOrder: orderMetadata.createOrder,
        fullFillOrder: orderMetadata.fullFillOrder,
        position: orderMetadata.position,
        usdcSize: orderMetadata.usdcSize || '0',
        orderType: orderMetadata.orderType,
        limitPrice: orderMetadata.limitPrice || '0',
        maxSlippage: orderMetadata.maxSlippage || '0',
      } as CombinedOrder;
    }

    const price = orderMetadata?.entryPrice ?? onchainOrder.limitPrice;
    return {
      orderId: onchainOrder.orderId?.toString(),
      orderPDA: onchainOrder.address?.toString(),
      basktId: onchainOrder.basktId?.toString(),
      owner: onchainOrder.owner?.toString(),
      status: onchainOrder.status,
      action: onchainOrder.action,
      size: onchainOrder.size?.toString(),
      collateral: onchainOrder.collateral?.toString(),
      isLong: onchainOrder.isLong,
      createOrder: orderMetadata?.createOrder,
      fullFillOrder: orderMetadata?.fullFillOrder,
      position: orderMetadata?.position,
      usdcSize: '0', // Placeholder for USDC size calculation
      orderType: onchainOrder.orderType,
      limitPrice: onchainOrder.limitPrice?.toString(),
      maxSlippage: onchainOrder.maxSlippage?.toString(),
    } as CombinedOrder;
  }
}
