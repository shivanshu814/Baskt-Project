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
   * Calculate APR based on fee data and liquidity
   */
  private calculateAPR(totalFeesToBlp: number, totalLiquidity: number, timeWindowDays: number = 30): number {
    if (totalLiquidity === 0) return 0;
    
    // Calculate daily fee rate
    const dailyFeeRate = totalFeesToBlp / totalLiquidity / timeWindowDays;
    
    // Annualize the rate (365 days)
    const annualizedRate = dailyFeeRate * 365;
    
    // Convert to percentage
    return annualizedRate * 100;
  }

  /**
   * Get fee data for a specific time window
   */
  async getFeeDataForTimeWindow(daysBack: number = 30): Promise<QueryResult<{
    totalFees: number;
    totalFeesToBlp: number;
    eventCount: number;
    timeWindowDays: number;
  }>> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysBack);
      
      const feeEventResult = await this.getFeeEventsWithFilters({
        startDate,
        endDate,
        limit: 10000, // Get all events in the time window
        offset: 0,
      });
      
      if (!feeEventResult.success) {
        return {
          success: true,
          data: {
            totalFees: 0,
            totalFeesToBlp: 0,
            eventCount: 0,
            timeWindowDays: daysBack,
          },
        };
      }
      
      const events = feeEventResult.data || [];
      const totalFees = events.reduce((sum, event) => sum + (parseFloat(event.totalFee) || 0), 0);
      const totalFeesToBlp = events.reduce((sum, event) => sum + (parseFloat(event.feeToBlp) || 0), 0);
      
      return {
        success: true,
        data: {
          totalFees,
          totalFeesToBlp,
          eventCount: events.length,
          timeWindowDays: daysBack,
        },
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to get fee data for time window',
        error: querierError.message,
      };
    }
  }

  /**
   * Get pool analytics including APR and fee data
   */
  async getPoolAnalytics(totalLiquidity: number, timeWindowDays: number = 30): Promise<QueryResult<{
    apr: string;
    totalFeesEarned: string;
    recentFeeData: {
      totalFees: string;
      totalFeesToBlp: string;
      eventCount: number;
      timeWindowDays: number;
    };
    feeStats: any;
  }>> {
    try {
      const [feeStatsResult, recentFeeDataResult] = await Promise.all([
        this.getFeeEventStatsOnly(),
        this.getFeeDataForTimeWindow(timeWindowDays),
      ]);
      
      // Convert totalLiquidity from raw format to USDC
      const totalLiquidityUSDC = totalLiquidity / 1_000_000;
      
      // Calculate APR using recent fee data
      const recentFeeData = (recentFeeDataResult.success && recentFeeDataResult.data) ? recentFeeDataResult.data : {
        totalFees: 0,
        totalFeesToBlp: 0,
        eventCount: 0,
        timeWindowDays,
      };
      
      const apr = this.calculateAPR(
        recentFeeData.totalFeesToBlp / 1_000_000, // Convert to USDC
        totalLiquidityUSDC,
        timeWindowDays
      );
      
      // Get total fees earned (all time) - convert to USDC
      const totalFeesEarned = feeStatsResult.success ? (feeStatsResult.data.totalFees / 1_000_000) : 0;
      
      return {
        success: true,
        data: {
          apr: apr.toFixed(2),
          totalFeesEarned: totalFeesEarned.toFixed(2),
          recentFeeData: {
            totalFees: (recentFeeData.totalFees / 1_000_000).toFixed(2),
            totalFeesToBlp: (recentFeeData.totalFeesToBlp / 1_000_000).toFixed(2),
            eventCount: recentFeeData.eventCount,
            timeWindowDays: recentFeeData.timeWindowDays,
          },
          feeStats: feeStatsResult.success ? feeStatsResult.data : null,
        },
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to get pool analytics',
        error: querierError.message,
      };
    }
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

  /**
   * Get all fee events
   */
  async getFeeEvents(limit: number = 100, offset: number = 0): Promise<QueryResult<any[]>> {
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
        message: 'Failed to get fee events',
        error: querierError.message,
      };
    }
  }

  /**
   * Get aggregated fee statistics only
   */
  async getFeeEventStatsOnly(): Promise<QueryResult<any>> {
    try {
      const [totalEvents, aggregatedStats] = await Promise.all([
        FeeEventMetadataModel.countDocuments(),
        FeeEventMetadataModel.aggregate([
          {
            $group: {
              _id: '$eventType',
              count: { $sum: 1 },
              totalFeesToTreasury: { $sum: { $toDouble: '$feeToTreasury' } },
              totalFeesToBlp: { $sum: { $toDouble: '$feeToBlp' } },
              totalFees: { $sum: { $toDouble: '$totalFee' } },
              avgLiquidityAmount: { $avg: { $toDouble: '$liquidityAmount' } },
            },
          },
        ]),
      ]);
      
      const totalFees = aggregatedStats.reduce((sum, stat) => sum + stat.totalFees, 0);
      const totalFeesToTreasury = aggregatedStats.reduce((sum, stat) => sum + stat.totalFeesToTreasury, 0);
      const totalFeesToBlp = aggregatedStats.reduce((sum, stat) => sum + stat.totalFeesToBlp, 0);
      
      return {
        success: true,
        data: {
          totalEvents,
          totalFees,
          totalFeesToTreasury,
          totalFeesToBlp,
          eventTypeBreakdown: aggregatedStats,
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

  /**
   * Get all fee event data (events + stats combined)
   */
  async getAllFeeEventData(limit: number = 100, offset: number = 0): Promise<QueryResult<any>> {
    try {
      const [eventsResult, statsResult] = await Promise.all([
        this.getFeeEvents(limit, offset),
        this.getFeeEventStatsOnly(),
      ]);

      if (!eventsResult.success) {
        return eventsResult;
      }

      if (!statsResult.success) {
        return statsResult;
      }

      return {
        success: true,
        data: {
          events: eventsResult.data,
          stats: statsResult.data,
        },
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to get all fee event data',
        error: querierError.message,
      };
    }
  }
} 