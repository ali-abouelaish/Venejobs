"use strict";

module.exports = (sequelize, DataTypes) => {
    const FreelancerExperience = sequelize.define(
        "FreelancerExperience",
        {
            freelancer_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            job_title: {
                type: DataTypes.STRING,
                allowNull: false
            },

            company: {
                type: DataTypes.STRING,
                allowNull: false
            },

            location: {
                type: DataTypes.STRING
            },

            city: {
                type: DataTypes.STRING
            },

            start_month: {
                type: DataTypes.STRING,
                allowNull: false
            },

            start_year: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            end_month: {
                type: DataTypes.STRING
            },

            end_year: {
                type: DataTypes.INTEGER
            },

            is_current: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },

            description: {
                type: DataTypes.TEXT
            }
        },
        {
            tableName: "freelancer_experiences",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );

    FreelancerExperience.associate = (models) => {
        FreelancerExperience.belongsTo(models.FreelancerProfile, {
            foreignKey: "freelancer_id",
            onDelete: "CASCADE"
        });
    };

    return FreelancerExperience;
};
