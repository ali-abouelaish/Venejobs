"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("proposals", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      job_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "jobs", key: "id" },
        onDelete: "CASCADE",
      },
      freelancer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      cover_letter: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      proposed_amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      estimated_duration: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "accepted", "rejected"),
        allowNull: false,
        defaultValue: "pending",
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

    await queryInterface.addConstraint("proposals", {
      fields: ["job_id", "freelancer_id"],
      type: "unique",
      name: "unique_proposal_per_job_per_freelancer",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("proposals");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_proposals_status"'
    );
  },
};
