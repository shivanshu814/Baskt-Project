import { DataTypes, Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

export const sequelizeConnection = new Sequelize(process.env.TIMESCALE_DB ?? '', {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
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

export const AssetPrice = sequelizeConnection.define('asset_prices', {
  asset_id: {
    allowNull: false,
    type: DataTypes.STRING,
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
});
