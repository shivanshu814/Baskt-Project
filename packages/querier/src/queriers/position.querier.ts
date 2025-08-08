import { PositionMetadataModel } from '../models/mongodb';
import { PositionOptions, QueryResult } from '../models/types';
import { handleQuerierError } from '../utils/error-handling';
import { BaseClient } from '@baskt/sdk';
import { CombinedPosition } from '../types/position';
import BN from 'bn.js';

// Fee constants from the program
const OPENING_FEE_BPS = 10; // 0.1%
const CLOSING_FEE_BPS = 10; // 0.1%
const BPS_DIVISOR = 10000; // 100%

/**
 * Position Querier
 *
 * This file is used to get position data from MongoDB and Onchain.
 * It is used wherever position info is needed, such as for baskt, asset, and order.
 * It has methods to fetch all positions and combine data from multiple sources.
 */
export class PositionQuerier {
  private basktClient: BaseClient;
  constructor(basktClient: BaseClient) {
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
   * Calculate fees for a position
   */
  private calculateFees(usdcSize: string): number {
    const totalFeeBps = OPENING_FEE_BPS + CLOSING_FEE_BPS;
    const feeRate = totalFeeBps / BPS_DIVISOR;
    const positionValue = new BN(usdcSize || '0').toNumber();
    return positionValue * feeRate;
  }

  /**
   * Get all positions with optional filters
   */
  async getPositions(options: PositionOptions = {}): Promise<QueryResult<CombinedPosition[]>> {
    try {
      const onchainPositions = await this.basktClient.getAllPositions();

      // Build MongoDB filter
      const filter: any = {};
      if (options.basktId) filter.basktId = options.basktId;
      if (options.assetId) filter.assetId = options.assetId;
      if (options.userId) filter.owner = { $regex: options.userId, $options: 'i' };
      if (typeof options.isActive === 'boolean') {
        filter.status = options.isActive ? 'OPEN' : 'CLOSED';
      }

      const positionMetadatas = await PositionMetadataModel.find(filter);
      // Combine onchain and metadata positions
      const combinedPositions = onchainPositions
        .map((onchainPosition) => {
          const meta = positionMetadatas.find(
            (m: any) =>
              m.positionPDA.toLowerCase() === onchainPosition.positionPDA.toString().toLowerCase(),
          );
          return this.convertPosition(onchainPosition, meta);
        })
        .filter((position): position is CombinedPosition => position !== null);

      // Also include position metadata that don't have corresponding on-chain positions
      const onchainPositionPDAs = onchainPositions.map((position) =>
        position.positionPDA.toString().toLowerCase(),
      );
      const metadataOnlyPositions = positionMetadatas
        .filter((meta: any) => !onchainPositionPDAs.includes(meta.positionPDA.toLowerCase()))
        .map((meta: any) => this.convertPosition(null, meta))
        .filter((position): position is CombinedPosition => position !== null);

      const allPositions = [...combinedPositions, ...metadataOnlyPositions];
      const result: QueryResult<CombinedPosition[]> = {
        success: true,
        data: allPositions,
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

  private convertPosition(
    onchainPosition: any | null,
    positionMetadata: any,
  ): CombinedPosition | null {
    if (!positionMetadata) return null;

    if (!onchainPosition) {
      const usdcSize = this.calculateUsdcSize(positionMetadata);
      const fees = this.calculateFees(usdcSize);

      return {
        positionId: positionMetadata.positionId,
        positionPDA: positionMetadata.positionPDA,
        basktId: positionMetadata.basktId,
        openOrder: positionMetadata.openOrder,
        closeOrder: positionMetadata.closeOrder,
        openPosition: positionMetadata.openPosition,
        closePosition: positionMetadata.closePosition,
        positionStatus: positionMetadata.status,
        entryPrice: positionMetadata.entryPrice || '',
        exitPrice: positionMetadata.exitPrice || '',
        owner: positionMetadata.owner,
        status: positionMetadata.status,
        size: positionMetadata.size || '0',
        remainingSize: positionMetadata.remainingSize || positionMetadata.size || '0',
        collateral: positionMetadata.collateral || '0',
        isLong: positionMetadata.isLong,
        usdcSize: usdcSize,
        fees: fees,
        partialCloseHistory: positionMetadata.partialCloseHistory || [],
        createdAt: positionMetadata.createdAt,
        updatedAt: positionMetadata.updatedAt,
      } as CombinedPosition;
    }

    const usdcSize = this.calculateUsdcSize(onchainPosition);
    const fees = this.calculateFees(usdcSize);

    return {
      positionId: onchainPosition.positionId?.toString(),
      positionPDA: onchainPosition.positionPDA?.toString(),
      basktId: onchainPosition.basktId,
      openOrder: positionMetadata?.openOrder,
      closeOrder: positionMetadata?.closeOrder,
      openPosition: positionMetadata?.openPosition,
      closePosition: positionMetadata?.closePosition,
      positionStatus: onchainPosition.status,
      entryPrice: onchainPosition.entryPrice?.toString() || '',
      exitPrice: onchainPosition.exitPrice?.toString() || '',
      owner: onchainPosition.owner?.toString(),
      status: onchainPosition.status,
      size: onchainPosition.size?.toString(),
      remainingSize: positionMetadata?.remainingSize || onchainPosition.size?.toString(),
      collateral: onchainPosition.collateral?.toString(),
      isLong: onchainPosition.isLong,
      usdcSize: usdcSize,
      fees: fees,
      partialCloseHistory: positionMetadata?.partialCloseHistory || [],
      createdAt: positionMetadata?.createdAt,
      updatedAt: positionMetadata?.updatedAt,
    } as CombinedPosition;
  }
}
