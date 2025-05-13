import { DataTypes, Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

export const sequelizeConnection = new Sequelize(process.env.TIMESCALE_DB ?? '', {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
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
