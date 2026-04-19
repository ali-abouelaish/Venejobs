"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Job extends Model {
        static associate(models) {
            Job.belongsTo(models.User, {
                foreignKey: "client_id",
                as: "client"
            });
            Job.hasMany(models.Proposal, {
                foreignKey: "job_id",
                as: "proposals"
            });
            Job.hasOne(models.Order, {
                foreignKey: "job_id",
                as: "order"
            });
        }
    }

    Job.init(
        {
            title: DataTypes.STRING,
            description: DataTypes.TEXT,
            category: DataTypes.STRING,
            skills: DataTypes.ARRAY(DataTypes.STRING),
            project_size: {
                type: DataTypes.ENUM("Small", "Medium", "Large"),
                allowNull: false
            },
            duration: DataTypes.STRING,
            experience_level: {
                type: DataTypes.ENUM("Entry", "Intermediate", "Expert"),
                allowNull: false
            },

            budget_type: {
                type: DataTypes.ENUM("hourly", "fixed", "monthly"),
                allowNull: false
            },
            budget_amount: DataTypes.FLOAT,

            hire_count: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
                validate: { min: 1, max: 10 },
            },

            status: {
                type: DataTypes.ENUM("draft", "published", "paused", "filled", "closed"),
                allowNull: false,
                defaultValue: "draft"
            },

            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            attachment: {
                type: String,
                default: null
            },
            client_id: DataTypes.INTEGER
        },
        {
            sequelize,
            modelName: "Job",
            tableName: "jobs",

            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );

    return Job;
};
