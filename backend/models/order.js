"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.Job, {
        foreignKey: "job_id",
        as: "job",
      });
      Order.belongsTo(models.Proposal, {
        foreignKey: "proposal_id",
        as: "proposal",
      });
      Order.belongsTo(models.User, {
        foreignKey: "client_id",
        as: "client",
      });
      Order.belongsTo(models.User, {
        foreignKey: "freelancer_id",
        as: "freelancer",
      });
    }
  }

  Order.init(
    {
      type: {
        type: DataTypes.ENUM("proposal", "direct"),
        allowNull: false,
        defaultValue: "proposal",
      },
      job_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      proposal_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      freelancer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "completed", "cancelled"),
        allowNull: false,
        defaultValue: "active",
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "orders",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Order;
};
