"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Proposal extends Model {
    static associate(models) {
      Proposal.belongsTo(models.User, {
        foreignKey: "freelancer_id",
        as: "freelancer",
      });
      Proposal.belongsTo(models.Job, {
        foreignKey: "job_id",
        as: "job",
      });
    }
  }

  Proposal.init(
    {
      job_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      freelancer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cover_letter: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      proposed_amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      estimated_duration: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "accepted", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: "Proposal",
      tableName: "proposals",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Proposal;
};
