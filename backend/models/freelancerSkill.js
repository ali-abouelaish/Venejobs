"use strict";

module.exports = (sequelize, DataTypes) => {
    const FreelancerSkill = sequelize.define(
        "FreelancerSkill",
        {
            freelancer_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            skill_name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            level: {
                type: DataTypes.STRING,
                allowNull: true
            }
        },
        {
            tableName: "freelancer_skills",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",
            indexes: [
                {
                    unique: true,
                    fields: ["freelancer_id", "skill_name"]
                }
            ]
        }
    );

    FreelancerSkill.associate = (models) => {
        FreelancerSkill.belongsTo(models.FreelancerProfile, {
            foreignKey: "freelancer_id",
            onDelete: "CASCADE"
        });
    };

    return FreelancerSkill;
};
