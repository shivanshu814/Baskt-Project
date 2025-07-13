import { QueryResult } from '../models/types';
import { PositionStatus } from '@baskt/types';

/**
 * Open interest data structure
 */
export interface OpenInterestData {
  totalOpenInterest: number;
  totalPositions: number;
  longOpenInterest: number;
  shortOpenInterest: number;
  longPositions: any[];
  shortPositions: any[];
}

/**
 * Volume data structure
 */
export interface VolumeData {
  totalVolume: number;
  totalPositions: number;
  longVolume: number;
  shortVolume: number;
}

/**
 * Open interest query parameters for baskt
 */
export interface BasktOpenInterestParams {
  basktId: string;
  positionStatus?: PositionStatus;
}

/**
 * Open interest query parameters for asset
 */
export interface AssetOpenInterestParams {
  assetId: string;
  positionStatus?: PositionStatus;
}

/**
 * Volume query parameters for baskt
 */
export interface BasktVolumeParams {
  basktId: string;
}

/**
 * Volume query parameters for asset
 */
export interface AssetVolumeParams {
  assetId: string;
}

/**
 * Open interest query result
 */
export interface OpenInterestResult {
  success: boolean;
  data?: OpenInterestData;
  error?: string;
}

/**
 * Volume query result
 */
export interface VolumeResult {
  success: boolean;
  data?: VolumeData;
  error?: string;
}

/**
 * Comprehensive metrics for a baskt
 */
export interface BasktMetrics {
  basktId: string;
  basktName: string;
  openInterest: OpenInterestData;
  volume: VolumeData;
  averagePositionSize: number;
  uniqueTraders: number;
  longShortRatio: number;
}

/**
 * Comprehensive metrics for an asset
 */
export interface AssetMetrics {
  assetId: string;
  assetName: string;
  openInterest: OpenInterestData;
  volume: VolumeData;
  averagePositionSize: number;
  uniqueTraders: number;
  longShortRatio: number;
  activeBaskts: string[];
}

/**
 * Platform-wide metrics
 */
export interface PlatformMetrics {
  totalOpenInterest: number;
  totalVolume: number;
  totalPositions: number;
  uniqueTraders: number;
  activeBaskts: number;
  activeAssets: number;
  longShortRatio: number;
} 