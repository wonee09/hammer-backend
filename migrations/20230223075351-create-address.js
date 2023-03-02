'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Address', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      xLoc: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      yLoc: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      totalRoadAddress: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      zoneNo: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      buildingName: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      roadName: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      mainBuildingNo: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      subBuildingNo: {
        type: Sequelize.STRING,
      },
      undergroundYn: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('now'),
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Address');
  },
};
