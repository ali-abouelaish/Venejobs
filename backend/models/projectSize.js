"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class ProjectSize extends Model { }

    ProjectSize.init(
        {
            code: { type: DataTypes.STRING, unique: true, allowNull: false },
            title: DataTypes.STRING,
            description: DataTypes.STRING
        },
        {
            sequelize,
            modelName: "ProjectSize",
            tableName: "project_sizes",
            timestamps: false
        }
    );

    return ProjectSize;
};
