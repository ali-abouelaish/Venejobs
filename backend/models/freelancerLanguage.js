"use strict";

module.exports = (sequelize, DataTypes) => {
    const FreelancerLanguage = sequelize.define(
        "FreelancerLanguage",
        {
            freelancer_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            language: {
                type: DataTypes.STRING,
                allowNull: false
            },
            proficiency: {
                type: DataTypes.STRING
            }
        },
        {
            tableName: "freelancer_languages",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );

    FreelancerLanguage.associate = (models) => {
        FreelancerLanguage.belongsTo(models.FreelancerProfile, {
            foreignKey: "freelancer_id",
            onDelete: "CASCADE"
        });
    };

    return FreelancerLanguage;
};
