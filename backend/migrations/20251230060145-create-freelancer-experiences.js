"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("freelancer_experiences", {
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

      job_title: {
        type: Sequelize.STRING,
        allowNull: false
      },

      company: {
        type: Sequelize.STRING,
        allowNull: false
      },

      location: {
        type: Sequelize.STRING
      },

      city: {
        type: Sequelize.STRING
      },

      start_month: {
        type: Sequelize.STRING,
        allowNull: false
      },

      start_year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      end_month: {
        type: Sequelize.STRING
      },

      end_year: {
        type: Sequelize.INTEGER
      },

      is_current: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },

      description: {
        type: Sequelize.TEXT
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
    await queryInterface.dropTable("freelancer_experiences");
  }
};
