'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Posts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Posts.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      title: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      contents: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      writerId: {
        allowNull: false,
        type: DataTypes.NUMBER,
      },
      likes: {
        allowNull: false,
        type: DataTypes.NUMBER,
      },
      hits: {
        allowNull: false,
        type: DataTypes.NUMBER,
      },
      addressId: {
        allowNull: false,
        type: DataTypes.NUMBER,
      },
      deletedYn: {
        type: DataTypes.BOOLEAN,
      },
      deletedAt: {
        type: DataTypes.DATE,
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
      modelName: 'Posts',
    }
  );
  return Posts;
};
