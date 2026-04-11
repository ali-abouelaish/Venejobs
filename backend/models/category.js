"use strict";

module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define(
        "Category",
        {
            code: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            }
        },
        {
            tableName: "categories",
            timestamps: false
        }
    );

    // 🔥 Association (NO class)
    Category.associate = (models) => {
        Category.hasMany(models.Skill, {
            foreignKey: "categoryCode",
            sourceKey: "code"
        });
    };

    return Category;
};
