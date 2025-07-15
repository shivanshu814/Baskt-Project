import { FeeEventMetadataModel } from '../models/mongodb';
import { handleQuerierError } from '../utils/error-handling';
import { QueryResult } from '../models/types';
import { BaseClient } from '@baskt/sdk';
import { FeeEventData, FeeEventFilterOptions, FeeEventStats } from '../types/fee-event';

/**
 * Fee Event Querier
 *
 * This class provides methods to query fee event data from MongoDB.
 * It handles all fee-related events from the Baskt protocol including position and liquidity events.
 */
export class FeeEventQuerier {
  private basktClient: BaseClient;

  constructor(basktClient: BaseClient) {
    this.basktClient = basktClient;
  }

  /**
   * Create a new fee event
   */
  async createFeeEvent(feeEventData: FeeEventData): Promise<QueryResult<any>> {
    try {
      const feeEvent = new FeeEventMetadataModel(feeEventData);
      const savedFeeEvent = await feeEvent.save();
      
      return {
        success: true,
        data: savedFeeEvent,
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to create fee event',
        error: querierError.message,
      };
    }
  }

  /**
   * Find fee event by event ID
   */
  async findFeeEventByEventId(eventId: string): Promise<QueryResult<any>> {
    try {
      const feeEvent = await FeeEventMetadataModel.findOne({ eventId }).exec();
      
      return {
        success: true,
        data: feeEvent,
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to find fee event by event ID',
        error: querierError.message,
      };
    }
  }

  /**
   * Find fee events by transaction signature
   */
  async findFeeEventsByTransactionSignature(transactionSignature: string): Promise<QueryResult<any[]>> {
    try {
      const feeEvents = await FeeEventMetadataModel.find({ transactionSignature })
        .sort({ timestamp: -1 })
        .exec();
      
      return {
        success: true,
        data: feeEvents,
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to find fee events by transaction signature',
        error: querierError.message,
      };
    }
  }

  /**
   * Find fee events by event type
   */
  async findFeeEventsByEventType(eventType: string): Promise<QueryResult<any[]>> {
    try {
      const feeEvents = await FeeEventMetadataModel.find({ eventType })
        .sort({ timestamp: -1 })
        .exec();
      
      return {
        success: true,
        data: feeEvents,
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to find fee events by event type',
        error: querierError.message,
      };
    }
  }

  /**
   * Find fee events by owner
   */
  async findFeeEventsByOwner(owner: string): Promise<QueryResult<any[]>> {
    try {
      const feeEvents = await FeeEventMetadataModel.find({ owner })
        .sort({ timestamp: -1 })
        .exec();
      
      return {
        success: true,
        data: feeEvents,
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to find fee events by owner',
        error: querierError.message,
      };
    }
  }

  /**
   * Find fee events by baskt ID
   */
  async findFeeEventsByBasktId(basktId: string): Promise<QueryResult<any[]>> {
    try {
      const feeEvents = await FeeEventMetadataModel.find({ basktId })
        .sort({ timestamp: -1 })
        .exec();
      
      return {
        success: true,
        data: feeEvents,
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to find fee events by baskt ID',
        error: querierError.message,
      };
    }
  }

  /**
   * Get all fee events with pagination
   */
  async getAllFeeEvents(limit: number = 100, offset: number = 0): Promise<QueryResult<any[]>> {
    try {
      const feeEvents = await FeeEventMetadataModel.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .exec();
      
      return {
        success: true,
        data: feeEvents,
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to get all fee events',
        error: querierError.message,
      };
    }
  }

  /**
   * Get fee events with advanced filtering
   */
  async getFeeEventsWithFilters(filters: FeeEventFilterOptions): Promise<QueryResult<any[]>> {
    try {
      const query: any = {};
      
      if (filters.eventType) query.eventType = filters.eventType;
      if (filters.owner) query.owner = filters.owner;
      if (filters.basktId) query.basktId = filters.basktId;
      
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = filters.startDate;
        if (filters.endDate) query.timestamp.$lte = filters.endDate;
      }
      
      const feeEvents = await FeeEventMetadataModel.find(query)
        .sort({ timestamp: -1 })
        .limit(filters.limit || 100)
        .skip(filters.offset || 0)
        .exec();
      
      return {
        success: true,
        data: feeEvents,
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to get fee events with filters',
        error: querierError.message,
      };
    }
  }

  /**
   * Get fee event statistics
   */
  async getFeeEventStats(): Promise<QueryResult<FeeEventStats>> {
    try {
      const [totalEvents, eventTypeStats] = await Promise.all([
        FeeEventMetadataModel.countDocuments(),
        FeeEventMetadataModel.aggregate([
          {
            $group: {
              _id: '$eventType',
              count: { $sum: 1 },
              totalFeesToTreasury: { $sum: { $toDouble: '$feeToTreasury' } },
              totalFeesToBlp: { $sum: { $toDouble: '$feeToBlp' } },
              totalFees: { $sum: { $toDouble: '$totalFee' } },
            },
          },
        ]),
      ]);
      
      return {
        success: true,
        data: {
          totalEvents,
          eventTypeStats,
        },
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to get fee event statistics',
        error: querierError.message,
      };
    }
  }
} 