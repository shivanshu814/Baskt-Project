import { metadataManager } from '../models/metadata-manager';
import { HistoryItem, OrderAction, PositionStatus } from '@baskt/types';
import { HistoryQueryParams, HistoryResult } from '../types/history';

/**
 * HistoryQuerier
 *
 * This class is responsible for fetching the history of orders and positions.
 * It is used to fetch the history of orders and positions.
 */

// TODO: @nshmadhani We need to redo this 
export class HistoryQuerier {
  // get history of orders and positions
  async getHistory(params: HistoryQueryParams): Promise<HistoryResult> {
   return {
    success: true,
    data: [],
   }
  }
}
