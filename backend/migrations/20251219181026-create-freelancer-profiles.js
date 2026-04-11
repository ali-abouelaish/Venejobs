"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("freelancer_profiles", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },

      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "users",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },

      professional_title: {
        type: Sequelize.STRING,
        allowNull: false
      },

      overview: {
        type: Sequelize.TEXT,
        allowNull: false
      },

      hourly_rate: {
        type: Sequelize.FLOAT,
        allowNull: true
      },

      country: {
        type: Sequelize.STRING,
        allowNull: true
      },

      city: {
        type: Sequelize.STRING,
        allowNull: true
      },

      profile_completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("freelancer_profiles");
  }
};
