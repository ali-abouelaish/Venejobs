"use strict";

module.exports = (sequelize, DataTypes) => {
    const FreelancerPortfolio = sequelize.define(
        "FreelancerPortfolio",
        {
            freelancer_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT
            },
            project_url: {
                type: DataTypes.STRING
            }
        },
        {
            tableName: "freelancer_portfolios",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );

    FreelancerPortfolio.associate = (models) => {
        FreelancerPortfolio.belongsTo(models.FreelancerProfile, {
            foreignKey: "freelancer_id",
            onDelete: "CASCADE"
        });
    };

    return FreelancerPortfolio;
};
