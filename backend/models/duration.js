"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class Duration extends Model { }

    Duration.init(
        {
            code: { type: DataTypes.STRING, unique: true, allowNull: false },
            label: DataTypes.STRING
        },
        {
            sequelize,
            modelName: "Duration",
            tableName: "durations",
            timestamps: false
        }
    );

    return Duration;
};
