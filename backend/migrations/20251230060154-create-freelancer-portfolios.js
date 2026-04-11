"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("freelancer_portfolios", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      freelancer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "freelancer_profiles",
          key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
      },

      title: {
        type: Sequelize.STRING,
        allowNull: false
      },

      description: {
        type: Sequelize.TEXT
      },

      project_url: {
        type: Sequelize.STRING
      },

      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW")
      },

      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW")
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("freelancer_portfolios");
  }
};
