"use strict";

module.exports = (sequelize, DataTypes) => {
    const FreelancerProfile = sequelize.define(
        "FreelancerProfile",
        {
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },

            professional_title: {
                type: DataTypes.STRING,
                allowNull: false
            },

            overview: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            hourly_rate: {
                type: DataTypes.FLOAT,
                allowNull: true
            },

            country: {
                type: DataTypes.STRING,
                allowNull: true
            },

            city: {
                type: DataTypes.STRING,
                allowNull: true
            },

            profile_completed: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        },
        {
            tableName: "freelancer_profiles",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );

    FreelancerProfile.associate = (models) => {

        FreelancerProfile.belongsTo(models.User, {
            foreignKey: "user_id",
            onDelete: "CASCADE"
        });

        FreelancerProfile.hasMany(models.FreelancerSkill, {
            foreignKey: "freelancer_id",
            as: "skills",
            onDelete: "CASCADE"
        });

        FreelancerProfile.hasMany(models.FreelancerExperience, {
            foreignKey: "freelancer_id",
            as: "experiences",
            onDelete: "CASCADE"
        });

        FreelancerProfile.hasMany(models.FreelancerEducation, {
            foreignKey: "freelancer_id",
            as: "educations",
            onDelete: "CASCADE"
        });

        FreelancerProfile.hasMany(models.FreelancerLanguage, {
            foreignKey: "freelancer_id",
            as: "languages",
            onDelete: "CASCADE"
        });

        FreelancerProfile.hasMany(models.FreelancerPortfolio, {
            foreignKey: "freelancer_id",
            as: "portfolios",
            onDelete: "CASCADE"
        });
    };

    return FreelancerProfile;
};
