'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Address extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Address.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      xLoc: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      yLoc: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      totalRoadAddress: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      zoneNo: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      buildingName: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      roadName: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      mainBuildingNo: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      subBuildingNo: {
        type: DataTypes.STRING,
      },
      undergroundYn: {
        type: DataTypes.STRING,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'Address',
      freezeTableName: true,
    }
  );
  return Address;
};
