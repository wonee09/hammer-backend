'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Posts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      contents: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      writerId: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      likes: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      hits: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      addressId: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      deletedYn: {
        type: Sequelize.BOOLEAN,
      },
      deletedAt: {
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('Posts');
  },
};
