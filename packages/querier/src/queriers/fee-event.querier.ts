import { PRICE_PRECISION } from '@baskt/sdk';
import { FeeEventMetadataModel } from '../models/mongodb';
import { QueryResult } from '../models/types';
import { FeeEventFilterOptions } from '../types/fee-event';
import { FeeEventMetadata } from '../types/models';
import { handleQuerierError } from '../utils/error-handling';
import BN  from 'bn.js';

/**
 * Fee Event Querier
 *
 * This class provides methods to query fee event data from MongoDB.
 * It handles all fee-related events from the Baskt protocol including position and liquidity events.
 */
export class FeeEventQuerier {
  private static instance: FeeEventQuerier;

  public static getInstance(): FeeEventQuerier {
    if (!FeeEventQuerier.instance) {
      FeeEventQuerier.instance = new FeeEventQuerier();
    }
    return FeeEventQuerier.instance;
  }

  /**
   * Calculate APR based on fee data and liquidity over a time window in seconds
   */
  private calculateAPR(
    totalFeesToBlp: BN,
    totalLiquidity: BN,
    timeWindowSeconds: number = 30 * 24 * 60 * 60, // Default to 30 days in seconds
  ): number {
    if (totalLiquidity.eq(new BN(0))) return 0;
    const secondsInYear = 365 * 24 * 60 * 60;
    const annualizedRate = totalFeesToBlp.mul(new BN(secondsInYear)).mul(new BN(100)).div(totalLiquidity).div(new BN(timeWindowSeconds));
    return annualizedRate.toNumber();
  }

  /**
   * Get fee data for a specific time window in days
   */
  async getFeeDataForTimeWindow(daysBack: number = 30): Promise<
    QueryResult<{
      totalFees: BN;
      totalFeesToBlp: BN;
      eventCount: number;
      timeWindowSeconds: number;
    }>
  > {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - daysBack);
      // Set end date to end of current day for inclusivity
      endDate.setHours(23, 59, 59, 999);

      const feeEventResult = await this.getFeeEventsWithFilters({
        startDate: startDate,
        endDate: endDate,
      });

      if (!feeEventResult.success) {
        return {
          success: true,
          data: {
            totalFees: new BN(0),
            totalFeesToBlp: new BN(0),
            eventCount: 0,
            timeWindowSeconds: daysBack * 24 * 60 * 60, // Convert days to seconds
          },
        };
      }


      const events = feeEventResult.data || [];
      const lastEventTime = events[0].createdAt;

      const totalFees = events.reduce((sum, event) => {
        sum = sum.add(new BN(event.positionFee?.totalFee || '0'));
        sum = sum.add(new BN(event.liquidityFee?.totalFee || '0'));
        return sum;
      }, new BN(0));

      const totalFeesToBlp = events.reduce((sum, event) => {
        sum = sum.add(new BN(event.positionFee?.feeToBlp || '0'));
        sum = sum.add(new BN(event.liquidityFee?.feeToBlp || '0'));
        return sum;
      }, new BN(0));

      return {
        success: true,
        data: {
          totalFees,
          totalFeesToBlp,
          eventCount: events.length,
          timeWindowSeconds: (endDate.getTime() - lastEventTime.getTime()) / 1000,
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
  async getPoolAnalytics(
    totalLiquidityUSDC: BN,
    timeWindowDays: number = 30,
  ): Promise<
    QueryResult<{
      apr: number;
      totalFees: BN;
      recentFeeData: {
        totalFees: BN;
        totalFeesToBlp: BN;
        eventCount: number;
        timeWindowSeconds: number;
      };
    }>
  > {
    try {
      const [recentFeeDataResult, feeStatsResult] = await Promise.all([
        this.getFeeDataForTimeWindow(timeWindowDays),
        this.getFeeStats(),
      ]);

      const recentFeeData = recentFeeDataResult.success && recentFeeDataResult.data ? recentFeeDataResult.data : {
        totalFees: 0,
        totalFeesToBlp: 0,
        eventCount: 0,
        timeWindowSeconds: timeWindowDays * 24 * 60 * 60, // Convert days to seconds
      };

      const apr = this.calculateAPR(
        new BN(recentFeeData.totalFeesToBlp),
        totalLiquidityUSDC,
        recentFeeData.timeWindowSeconds,
      );

      return {
        success: true,
        data: {
          apr: apr,
          totalFees: feeStatsResult.data?.categoryStats.aggregate.totalFees || new BN(0),
          recentFeeData: {
            totalFees: new BN(recentFeeData.totalFees),
            totalFeesToBlp: new BN(recentFeeData.totalFeesToBlp),
            eventCount: recentFeeData.eventCount,
            timeWindowSeconds: recentFeeData.timeWindowSeconds,
          },
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
  async createFeeEvent(feeEventData: FeeEventMetadata): Promise<QueryResult<any>> {
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
   * Get fee events with advanced filtering
   */
  async getFeeEventsWithFilters(filters: FeeEventFilterOptions): Promise<QueryResult<any[]>> {
    try {
      const query: any = {};

      if (filters.eventType) query.eventType = filters.eventType;
      if (filters.owner) query.owner = filters.owner;
      if (filters.basktId) query.basktId = filters.basktId;

      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = filters.startDate;
        if (filters.endDate) query.createdAt.$lte = filters.endDate;
      }

      const feeEvents = await FeeEventMetadataModel.find(query)
        .sort({ createdAt: -1 })
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
   * Get fee event statistics (legacy method - now uses comprehensive stats)
   */
  async getFeeEventStats(): Promise<QueryResult<{
    totalEvents: number;
    eventTypeStats: Array<{
      _id: string;
      count: number;
      totalFeesToTreasury: number;
      totalFeesToBlp: number;
      totalFees: number;
    }>;
  }>> {
    try {
      const [totalEvents, eventTypeStats] = await Promise.all([
        FeeEventMetadataModel.countDocuments(),
        FeeEventMetadataModel.aggregate([
          {
            $group: {
              _id: '$eventType',
              count: { $sum: 1 },
              totalFeesToTreasury: { $sum: { $toDouble: '$positionFee.feeToTreasury' } },
              totalFeesToBlp: { $sum: { $toDouble: '$positionFee.feeToBlp' } },
              totalFees: { $sum: { $toDouble: '$positionFee.totalFee' } },
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
        .sort({ createdAt: -1 })
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

  async getFeeStats(): Promise<QueryResult<{
    totalFees: BN;
    eventCount: number;
    eventTypeStats: Array<{
      eventType: string;
      count: number;
      totalFees: BN;
      totalFeesToTreasury: BN;
      totalFeesToBlp: BN;
    }>;
    categoryStats: {
      baskt: {
        totalFees: BN;
        totalFeesToTreasury: BN;
        totalFeesToBlp: BN;
        eventCount: number;
      };
      position: {
        totalFees: BN;
        totalFeesToTreasury: BN;
        totalFeesToBlp: BN;
        eventCount: number;
      };
      liquidity: {
        totalFees: BN;
        totalFeesToTreasury: BN;
        totalFeesToBlp: BN;
        eventCount: number;
      };
      aggregate: {
        totalFees: BN;
        totalFeesToTreasury: BN;
        totalFeesToBlp: BN;
        eventCount: number;
      };
    };
  }>> {
    try {
      const aggregationResult = await FeeEventMetadataModel.aggregate([
        {
          $facet: {
            // Group by individual event types
            eventTypeStats: [
              {
                $group: {
                  _id: '$eventType',
                  count: { $sum: 1 },
                  totalFees: { $sum: { $toDouble: '$positionFee.totalFee' } },
                  totalFeesToTreasury: { $sum: { $toDouble: '$positionFee.feeToTreasury' } },
                  totalFeesToBlp: { $sum: { $toDouble: '$positionFee.feeToBlp' } },
                }
              },
              {
                $addFields: {
                  eventType: '$_id',
                  totalFees: { $ifNull: ['$totalFees', 0] },
                  totalFeesToTreasury: { $ifNull: ['$totalFeesToTreasury', 0] },
                  totalFeesToBlp: { $ifNull: ['$totalFeesToBlp', 0] }
                }
              },
              { $unset: '_id' }
            ],
            // Group by category (baskt, position, liquidity)
            categoryStats: [
              {
                $group: {
                  _id: {
                    category: {
                      $switch: {
                        branches: [
                          { case: { $in: ['$eventType', ['BASKT_CREATED', 'REBALANCE_REQUESTED']] }, then: 'baskt' },
                          { case: { $in: ['$eventType', ['POSITION_OPENED', 'POSITION_CLOSED', 'POSITION_LIQUIDATED']] }, then: 'position' },
                          { case: { $in: ['$eventType', ['LIQUIDITY_ADDED', 'LIQUIDITY_REMOVED']] }, then: 'liquidity' }
                        ],
                        default: 'other'
                      }
                    }
                  },
                  count: { $sum: 1 },
                  totalFees: { $sum: { $toDouble: '$positionFee.totalFee' } },
                  totalFeesToTreasury: { $sum: { $toDouble: '$positionFee.feeToTreasury' } },
                  totalFeesToBlp: { $sum: { $toDouble: '$positionFee.feeToBlp' } },
                }
              },
              {
                $addFields: {
                  category: '$_id.category',
                  totalFees: { $ifNull: ['$totalFees', 0] },
                  totalFeesToTreasury: { $ifNull: ['$totalFeesToTreasury', 0] },
                  totalFeesToBlp: { $ifNull: ['$totalFeesToBlp', 0] }
                }
              },
              { $unset: '_id' }
            ],
            // Overall aggregate stats
            aggregateStats: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  totalFees: { $sum: { $toDouble: '$positionFee.totalFee' } },
                  totalFeesToTreasury: { $sum: { $toDouble: '$positionFee.feeToTreasury' } },
                  totalFeesToBlp: { $sum: { $toDouble: '$positionFee.feeToBlp' } },
                }
              },
              {
                $addFields: {
                  totalFees: { $ifNull: ['$totalFees', 0] },
                  totalFeesToTreasury: { $ifNull: ['$totalFeesToTreasury', 0] },
                  totalFeesToBlp: { $ifNull: ['$totalFeesToBlp', 0] }
                }
              },
              { $unset: '_id' }
            ]
          }
        }
      ]);

      if (!aggregationResult || aggregationResult.length === 0) {
        return {
          success: true,
          data: {
            totalFees: new BN(0),
            eventCount: 0,
            eventTypeStats: [],
            categoryStats: {
              baskt: { totalFees: new BN(0), totalFeesToTreasury: new BN(0), totalFeesToBlp: new BN(0), eventCount: 0 },
              position: { totalFees: new BN(0), totalFeesToTreasury: new BN(0), totalFeesToBlp: new BN(0), eventCount: 0 },
              liquidity: { totalFees: new BN(0), totalFeesToTreasury: new BN(0), totalFeesToBlp: new BN(0), eventCount: 0 },
              aggregate: { totalFees: new BN(0), totalFeesToTreasury: new BN(0), totalFeesToBlp: new BN(0), eventCount: 0 }
            }
          }
        };
      }

      const result = aggregationResult[0];
      const aggregateStats = result.aggregateStats[0] || { count: 0, totalFees: 0, totalFeesToTreasury: 0, totalFeesToBlp: 0 };
      
      // Process category stats
      const categoryStats = {
        baskt: { totalFees: new BN(0), totalFeesToTreasury: new BN(0), totalFeesToBlp: new BN(0), eventCount: 0 },
        position: { totalFees: new BN(0), totalFeesToTreasury: new BN(0), totalFeesToBlp: new BN(0), eventCount: 0 },
        liquidity: { totalFees: new BN(0), totalFeesToTreasury: new BN(0), totalFeesToBlp: new BN(0), eventCount: 0 },
        aggregate: { 
          totalFees: new BN(aggregateStats.totalFees.toString()), 
          totalFeesToTreasury: new BN(aggregateStats.totalFeesToTreasury.toString()), 
          totalFeesToBlp: new BN(aggregateStats.totalFeesToBlp.toString()), 
          eventCount: aggregateStats.count 
        }
      };

      // Map category stats from aggregation
      result.categoryStats.forEach((cat: any) => {
        if (cat.category === 'baskt') {
          categoryStats.baskt = {
            totalFees: new BN(cat.totalFees.toString()),
            totalFeesToTreasury: new BN(cat.totalFeesToTreasury.toString()),
            totalFeesToBlp: new BN(cat.totalFeesToBlp.toString()),
            eventCount: cat.count
          };
        } else if (cat.category === 'position') {
          categoryStats.position = {
            totalFees: new BN(cat.totalFees.toString()),
            totalFeesToTreasury: new BN(cat.totalFeesToTreasury.toString()),
            totalFeesToBlp: new BN(cat.totalFeesToBlp.toString()),
            eventCount: cat.count
          };
        } else if (cat.category === 'liquidity') {
          categoryStats.liquidity = {
            totalFees: new BN(cat.totalFees.toString()),
            totalFeesToTreasury: new BN(cat.totalFeesToTreasury.toString()),
            totalFeesToBlp: new BN(cat.totalFeesToBlp.toString()),
            eventCount: cat.count
          };
        }
      });

      // Process event type stats
      const eventTypeStats = result.eventTypeStats.map((stat: any) => ({
        eventType: stat.eventType,
        count: stat.count,
        totalFees: new BN(stat.totalFees.toString()),
        totalFeesToTreasury: new BN(stat.totalFeesToTreasury.toString()),
        totalFeesToBlp: new BN(stat.totalFeesToBlp.toString())
      }));

      return {
        success: true,
        data: {
          totalFees: categoryStats.aggregate.totalFees,
          eventCount: categoryStats.aggregate.eventCount,
          eventTypeStats,
          categoryStats
        }
      };
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to get fee statistics',
        error: querierError.message,
      };
    }
  }



  /**
   * Get all fee event data (events + stats combined)
   */
  async getAllFeeEventData(limit: number = 100, offset: number = 0): Promise<QueryResult<any>> {
    try {
      const eventsResult = await this.getFeeEvents(limit, offset);

      if (!eventsResult.success) {
        return eventsResult;
      }


      return {
        success: true,
        data: {
          events: eventsResult.data,
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
