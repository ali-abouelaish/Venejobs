"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class ExperienceLevel extends Model {}

    ExperienceLevel.init(
        {
            code: { type: DataTypes.STRING, unique: true, allowNull: false },
            title: DataTypes.STRING
        },
        {
            sequelize,
            modelName: "ExperienceLevel",
            tableName: "experience_levels",
            timestamps: false
        }
    );

    return ExperienceLevel;
};
