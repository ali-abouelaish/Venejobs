'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('durations', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      code: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('durations');
  }
};
