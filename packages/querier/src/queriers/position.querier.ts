import { PositionMetadataModel } from '../models/mongodb';
import { PositionOptions, QueryResult } from '../models/types';
import { handleQuerierError } from '../utils/error-handling';
import { BaseClient } from '@baskt/sdk';
import { CombinedPosition } from '../types/position';
import BN from 'bn.js';
import { PositionMetadata } from '../types';
import { PositionStatus } from '@baskt/types';
import { AssetQuerier } from './asset.querier';
import { BasktQuerier } from './baskt.querier';

/**
 * Position Querier
 *
 * This file is used to get position data from MongoDB and Onchain.
 * It is used wherever position info is needed, such as for baskt, asset, and order.
 * It has methods to fetch all positions and combine data from multiple sources.
 */
export class PositionQuerier {

  private basktClient: BaseClient;
  public static instance: PositionQuerier;

  public static getInstance(basktClient: BaseClient): PositionQuerier {
    if (!PositionQuerier.instance) {
      PositionQuerier.instance = new PositionQuerier(basktClient);
    }
    return PositionQuerier.instance;
  }

  private constructor(basktClient: BaseClient) {
    this.basktClient = basktClient;
  }

  /**
   * Calculate USDC size from position size and entry price
   */
  private calculateUsdcSize(position: any): string {
    if (position.usdcSize && new BN(position.usdcSize).gt(new BN(0))) {
      return position.usdcSize;
    }

    if (position.size && position.entryPrice) {
      const sizeBN = new BN(position.size);
      const entryPriceBN = new BN(position.entryPrice);
      const usdcSize = sizeBN.mul(entryPriceBN).div(new BN(1000000));
      return usdcSize.toString();
    }

    return '0';
  }


  /**
   * Get all positions with optional filters
   */ 
  async getPositions(options: PositionOptions = {}): Promise<QueryResult<CombinedPosition[]>> {
    try {

      // Build MongoDB filter
      const filter: any = {};
      if (options.basktId) filter.basktAddress = options.basktId;
      if (options.userId) filter.owner = options.userId;
      if (typeof options.isActive === 'boolean') {
        filter.status = options.isActive ? PositionStatus.OPEN : PositionStatus.CLOSED;
      }

      const positionMetadatas = await PositionMetadataModel.find(filter).lean<PositionMetadata[]>();
      // Combine onchain and metadata positions
      const combinedPositions = positionMetadatas
        .map((positionMetadata) => {
          return this.convertPosition(positionMetadata);
        });
 
      const result: QueryResult<CombinedPosition[]> = {
        success: true,
        data: combinedPositions,
      };

      return result;
    } catch (error) {
      const querierError = handleQuerierError(error);
      return {
        success: false,
        message: 'Failed to fetch positions',
        error: querierError.message,
      };
    }
  }

  async getPositionByAssetId(assetId: string, positionStatus: PositionStatus = PositionStatus.OPEN): Promise<QueryResult<CombinedPosition[]>> {
    const basktAssetResult = await BasktQuerier.getInstance(this.basktClient).getBasktByAssetId(assetId);

    if (!basktAssetResult.data) {
      return {
        success: true,
        data: []
      };
    }

    const positionResults = await Promise.all(
      basktAssetResult.data.map(baskt => 
        this.getPositions({ basktId: baskt.basktId, isActive:true })
      )
    );

    const combinedPositions = positionResults
      .filter(result => result.success && result.data)
      .flatMap(result => result.data!);

    return {
      success: true,
      data: combinedPositions
    };
  }

  async getPositionByAddress(address: string): Promise<QueryResult<any>> {
    const position = await PositionMetadataModel.findOne({ positionPDA: address });
    return {
      success: true,
      data: position,
    };
  }

  private convertPosition(positionMetadata: PositionMetadata): CombinedPosition {
      const usdcSize = this.calculateUsdcSize(positionMetadata);

      return {
        ...positionMetadata,
        usdcSize: usdcSize
      } as CombinedPosition;
    }
}
