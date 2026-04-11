"use strict";

module.exports = (sequelize, DataTypes) => {
    const Skill = sequelize.define(
        "Skill",
        {
            id: {
                type: DataTypes.STRING(8),
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            categoryCode: {
                type: DataTypes.STRING,
                allowNull: false
            }
        },
        {
            tableName: "skills",
            timestamps: false
        }
    );

    // 🔥 Association (NO class)
    Skill.associate = (models) => {
        Skill.belongsTo(models.Category, {
            foreignKey: "categoryCode",
            targetKey: "code"
        });
    };

    return Skill;
};
