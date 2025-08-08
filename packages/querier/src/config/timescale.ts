import { DataTypes, Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const RETRY_CONFIG = {
  maxAttempts: 5,
  initialDelay: 1 * 1000,
  maxDelay: 30 * 1000,
  backoffMultiplier: 2,
};

export const sequelizeConnection = new Sequelize(process.env.TIMESCALE_DB ?? '', {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    // SSL configuration differs between environments:
    // - Production: Requires SSL with strict certificate validation for security
    // - Local/Development: Disables SSL to avoid certificate issues with local databases
    ssl:
      process.env.NODE_ENV === 'production'
        ? {
            require: true,
            rejectUnauthorized: true,
          }
        : {
            require: false,
            rejectUnauthorized: false,
            ca: undefined,
            key: undefined,
            cert: undefined,
            checkServerIdentity: () => undefined,
          },
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  logging: false,
});

export const AssetPrice = sequelizeConnection.define(
  'asset_prices',
  {
    asset_id: {
      allowNull: false,
      type: DataTypes.STRING,
      primaryKey: true,
    },
    price: {
      allowNull: false,
      type: DataTypes.DECIMAL,
    },
    time: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.DATE,
    },
  },
  {
    timestamps: false,
  },
);

const calculateDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
};

const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const connectTimescaleDB = async (): Promise<void> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      await sequelizeConnection.authenticate();
      console.log('TimescaleDB connected successfully');
      return;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `TimescaleDB connection attempt ${attempt}/${RETRY_CONFIG.maxAttempts} failed:`,
        error,
      );

      if (attempt < RETRY_CONFIG.maxAttempts) {
        const delay = calculateDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        await wait(delay);
      }
    }
  }

  console.error('TimescaleDB connection failed after all retry attempts');
  throw lastError;
};

export const disconnectTimescaleDB = async (): Promise<void> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      await sequelizeConnection.close();
      console.log('TimescaleDB disconnected successfully');
      return;
    } catch (error) {
      lastError = error as Error;
      console.error(
        `TimescaleDB disconnection attempt ${attempt}/${RETRY_CONFIG.maxAttempts} failed:`,
        error,
      );

      if (attempt < RETRY_CONFIG.maxAttempts) {
        const delay = calculateDelay(attempt);
        console.log(`Retrying in ${delay}ms...`);
        await wait(delay);
      }
    }
  }

  console.error('TimescaleDB disconnection failed after all retry attempts');
  throw lastError;
};
