"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orders", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      type: {
        type: Sequelize.ENUM("proposal", "direct"),
        allowNull: false,
        defaultValue: "proposal",
      },
      job_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "jobs", key: "id" },
        onDelete: "SET NULL",
      },
      proposal_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
        references: { model: "proposals", key: "id" },
        onDelete: "SET NULL",
      },
      client_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "RESTRICT",
      },
      freelancer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "RESTRICT",
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("active", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "active",
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("orders");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_orders_type"'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_orders_status"'
    );
  },
};
