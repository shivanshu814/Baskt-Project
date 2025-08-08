import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import { Connection } from '@solana/web3.js';

// Import configurations
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { connectTimescaleDB, disconnectTimescaleDB, sequelizeConnection } from './config/timescale';
import { connectOnchain, getOnchainConfig } from './config/onchain';

// Import queriers
import { AssetQuerier } from './queriers/asset.querier';
import { BasktQuerier } from './queriers/baskt.querier';
import { PriceQuerier } from './queriers/price.querier';
import { OrderQuerier } from './queriers/order.querier';
import { PositionQuerier } from './queriers/position.querier';
import { HistoryQuerier } from './queriers/history.querier';
import { MetricsQuerier } from './queriers/metrics.querier';
import { AccessQuerier } from './queriers/access.querier';
import { FaucetQuerier } from './queriers/faucet.querier';
import { PoolQuerier } from './queriers/pool.querier';
import { FeeEventQuerier } from './queriers/fee-event.querier';
import { WithdrawQueueQuerier } from './queriers/withdraw-queue.querier';

// Import metadata manager
import { metadataManager } from './models/metadata-manager';
import { BaseClient } from '@baskt/sdk';

/**
 * Querier
 *
 * This file is used to initialize the querier package.
 * It is used to initialize the querier package.
 * It has methods to initialize the querier package.
 */
export class Querier {
  private static instance: Querier;

  // Singleton clients
  private mongoConnection: mongoose.Connection | null = null;
  private timescaleConnection: Sequelize | null = null;
  private solanaConnection: Connection | null = null;
  private basktClient: any; // Accept any SDK client

  // Querier instances
  public asset: AssetQuerier;
  public baskt: BasktQuerier;
  public price: PriceQuerier;
  public order: OrderQuerier;
  public position: PositionQuerier;
  public history: HistoryQuerier;
  public metrics: MetricsQuerier;
  public access: AccessQuerier;
  public faucet: FaucetQuerier;
  public pool: PoolQuerier;
  public feeEvent: FeeEventQuerier;
  public withdrawQueue: WithdrawQueueQuerier;

  // Metadata manager
  public metadata = metadataManager;

  private constructor(basktClient: BaseClient) {
    this.basktClient = basktClient;
    this.asset = new AssetQuerier(basktClient);
    this.price = new PriceQuerier(basktClient);
    this.baskt = new BasktQuerier(this.asset, this.price, basktClient);
    this.order = new OrderQuerier(basktClient);
    this.position = new PositionQuerier(basktClient);
    this.history = new HistoryQuerier();
    this.metrics = new MetricsQuerier(this.asset);
    this.access = new AccessQuerier();
    this.faucet = new FaucetQuerier(basktClient);
    this.pool = new PoolQuerier(basktClient);
    this.feeEvent = new FeeEventQuerier(basktClient);
    this.withdrawQueue = new WithdrawQueueQuerier(basktClient);
  }

  public static getInstance(basktClient: any): Querier {
    if (!Querier.instance) {
      Querier.instance = new Querier(basktClient);
    }
    return Querier.instance;
  }

  /**
   * Initialize all connections and clients
   */
  public async init(): Promise<void> {
    try {
      console.log('Initializing Querier...');

      // Initialize MongoDB
      await connectMongoDB();
      this.mongoConnection = mongoose.connection;

      // Initialize TimescaleDB
      await connectTimescaleDB();
      this.timescaleConnection = sequelizeConnection;

      // Initialize Solana connection
      await connectOnchain();
      this.solanaConnection = getOnchainConfig().connection;

      // Pass the basktClient to all queriers as needed (if they accept it)
      // (You may want to update queriers to accept the client in their constructors)

      console.log('Querier initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Querier:', error);
      throw error;
    }
  }

  /**
   * Shutdown all connections and cleanup
   */
  public async shutdown(): Promise<void> {
    try {
      console.log('Shutting down Querier...');

      // Disconnect MongoDB
      if (this.mongoConnection) {
        await disconnectMongoDB();
        this.mongoConnection = null;
      }

      // Disconnect TimescaleDB
      if (this.timescaleConnection) {
        await disconnectTimescaleDB();
        this.timescaleConnection = null;
      }

      // Disconnect Solana - no explicit disconnect needed
      this.solanaConnection = null;

      // Clear basktClient
      this.basktClient = null;

      console.log('Querier shutdown successfully');
    } catch (error) {
      console.error('Error during Querier shutdown:', error);
      throw error;
    }
  }

  /**
   * Get MongoDB connection
   */
  public getMongoConnection(): mongoose.Connection | null {
    return this.mongoConnection;
  }

  /**
   * Get TimescaleDB connection
   */
  public getTimescaleConnection(): Sequelize | null {
    return this.timescaleConnection;
  }

  /**
   * Get Solana connection
   */
  public getSolanaConnection(): Connection | null {
    return this.solanaConnection;
  }

  /**
   * Get BasktClient
   */
  public getBasktClient(): any {
    return this.basktClient;
  }

  /**
   * Check if all connections are healthy
   */
  public isHealthy(): boolean {
    return !!(
      this.mongoConnection?.readyState === 1 &&
      this.timescaleConnection &&
      this.solanaConnection &&
      this.basktClient
    );
  }
}

// Export a factory function instead of a singleton instance
export const createQuerier = (basktClient: any) => Querier.getInstance(basktClient);
