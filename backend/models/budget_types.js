"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class BudgetType extends Model { }

    BudgetType.init(
        {
            code: { type: DataTypes.STRING, unique: true, allowNull: false },
            label: { type: DataTypes.STRING, allowNull: false },
            min_amount: { type: DataTypes.INTEGER, allowNull: false },
            description: DataTypes.STRING,
            is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
        },
        {
            sequelize,
            modelName: "BudgetType",
            tableName: "budget_types",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );

    return BudgetType;
};
