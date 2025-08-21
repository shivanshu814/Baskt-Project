import { BaseClient } from '@baskt/sdk';
import BN from 'bn.js';
import { BasktMetadataModel, OrderMetadataModel } from '../models/mongodb';
import { OrderOptions, QueryResult } from '../models/types';
import { CombinedOrder } from '../types/order';
import { handleQuerierError } from '../utils/error-handling';
import { OrderMetadata } from '../types';

/**
 * Order Querier
 *
 * This file is used to get order data from MongoDB and Onchain.
 * It is used wherever order info is needed, such as for baskt, asset, and position.
 * It has methods to fetch all orders and combine data from multiple sources.
 */
export class OrderQuerier {
  private basktClient: BaseClient;
  public static instance: OrderQuerier;

  public static getInstance(basktClient: BaseClient): OrderQuerier {
    if (!OrderQuerier.instance) {
      OrderQuerier.instance = new OrderQuerier(basktClient);
    }
    return OrderQuerier.instance;
  }
  constructor(basktClient: BaseClient) {
    this.basktClient = basktClient;
  }

  /**
   * Get all orders with optional filters
   */
  async getOrders(options: OrderOptions = {}): Promise<QueryResult<CombinedOrder[]>> {
    try {
      const orderMetadatas = await this.getFilteredOrderMetadata(options);

      const combinedOrders = orderMetadatas.map((order) => this.combineOrder(order));

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

    if (options.basktId) filter.basktAddress = options.basktId;
    if (options.userId) filter.owner = { $regex: options.userId, $options: 'i' };
    if (options.orderStatus) filter.orderStatus = options.orderStatus;
    if (options.orderAction) filter.orderAction = options.orderAction;
    if (options.orderPDA) filter.orderPDA = options.orderPDA;

    return filter;
  }

  /**
   * Get filtered order metadata from MongoDB
   */
  private async getFilteredOrderMetadata(options: OrderOptions): Promise<OrderMetadata[]> {
    const filter = this.buildMongoFilter(options);
    return await OrderMetadataModel.find(filter).lean<OrderMetadata[]>();
  }


  /**
   * Create order from both onchain and metadata sources
   */
  private combineOrder(orderMetadata: OrderMetadata): CombinedOrder {

    const closeParams = orderMetadata.closeParams ? {
      ...orderMetadata.closeParams,
      sizeAsContracts: new BN(orderMetadata.closeParams?.sizeAsContracts?.toString() || '0'),
    } : undefined;

    const openParams = orderMetadata.openParams ? {
      ...orderMetadata.openParams,
      notionalValue: new BN(orderMetadata.openParams?.notionalValue?.toString() || '0'),
      collateral: new BN(orderMetadata.openParams?.collateral?.toString() || '0'),
    } : undefined;

    const limitParams = orderMetadata.limitParams ? {
      ...orderMetadata.limitParams,
      limitPrice: orderMetadata.limitParams?.limitPrice?.toString() ? Number(orderMetadata.limitParams?.limitPrice?.toString()) : undefined,
    } : undefined;


    return {
      ...orderMetadata,
      openParams,
      closeParams,
      limitParams,
    } as CombinedOrder;
  }
}
