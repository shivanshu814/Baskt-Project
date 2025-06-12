'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class asset_prices extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  asset_prices.init(
    {
      asset_id: DataTypes.STRING,
      price: DataTypes.DECIMAL,
      time: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'asset_prices',
    },
  );
  return asset_prices;
};
