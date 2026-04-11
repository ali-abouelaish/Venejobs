"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("experience_levels", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      label: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("experience_levels");
  }
};
