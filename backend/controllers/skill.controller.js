"use strict";

const { Skill, Category } = require("../models");

module.exports = {
    getSkills: async (req, res) => {
        try {
            const { categoryCode } = req.query;

            const queryOptions = {
                order: [["name", "ASC"]]
            };

            if (categoryCode) {
                queryOptions.where = { categoryCode };
                queryOptions.include = [
                    {
                        model: Category,
                        attributes: ["code", "name"]
                    }
                ];
            }

            const skills = await Skill.findAll(queryOptions);

            return res.status(200).json({
                success: true,
                data: skills
            });
        } catch (error) {
            console.error("Get Skills Error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch skills"
            });
        }
    }
};
